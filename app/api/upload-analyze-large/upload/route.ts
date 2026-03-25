/**
 * POST /api/upload-analyze-large/upload
 * 대용량 파일 청크 업로드 엔드포인트
 * 클라이언트에서 파일을 5MB 청크로 분할하여 순차 전송
 */
import { NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, stat } from 'fs/promises'
import path from 'path'
import os from 'os'

// 청크 저장 경로: OS 임시 디렉토리 하위
const UPLOAD_DIR = path.join(os.tmpdir(), 'ai-poc-uploads')

// 단일 청크 최대 크기: 5MB
const MAX_CHUNK_SIZE = 5 * 1024 * 1024

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData()

  const uploadId = formData.get('uploadId') as string | null
  const chunkIndex = formData.get('chunkIndex') as string | null
  const totalChunks = formData.get('totalChunks') as string | null
  const fileName = formData.get('fileName') as string | null
  const chunk = formData.get('chunk') as File | null

  if (!uploadId || !chunkIndex || !totalChunks || !fileName || !chunk) {
    return NextResponse.json(
      { error: '필수 파라미터가 누락되었습니다' },
      { status: 400 },
    )
  }

  if (chunk.size > MAX_CHUNK_SIZE) {
    return NextResponse.json(
      { error: '청크 크기가 5MB를 초과합니다' },
      { status: 413 },
    )
  }

  try {
    // 업로드 디렉토리 생성
    const uploadPath = path.join(UPLOAD_DIR, uploadId)
    await mkdir(uploadPath, { recursive: true })

    // 청크 파일 저장
    const buffer = Buffer.from(await chunk.arrayBuffer())
    const chunkPath = path.join(uploadPath, `chunk-${chunkIndex.padStart(6, '0')}`)
    await writeFile(chunkPath, buffer)

    // 메타데이터 저장 (첫 청크일 때)
    if (chunkIndex === '0') {
      const metaPath = path.join(uploadPath, 'meta.json')
      await writeFile(
        metaPath,
        JSON.stringify({
          fileName,
          totalChunks: Number(totalChunks),
          uploadedAt: new Date().toISOString(),
        }),
      )
    }

    // 업로드 완료 여부 확인
    const files = await readdir(uploadPath)
    const chunkFiles = files.filter((f) => f.startsWith('chunk-'))
    const isComplete = chunkFiles.length === Number(totalChunks)

    return NextResponse.json({
      uploadId,
      chunkIndex: Number(chunkIndex),
      received: chunkFiles.length,
      total: Number(totalChunks),
      complete: isComplete,
    })
  } catch (error) {
    console.error('[upload-large] 청크 저장 오류:', error)
    return NextResponse.json(
      { error: '청크 저장 중 오류가 발생했습니다' },
      { status: 500 },
    )
  }
}

// 업로드 상태 조회
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const uploadId = searchParams.get('uploadId')

  if (!uploadId) {
    return NextResponse.json(
      { error: 'uploadId가 필요합니다' },
      { status: 400 },
    )
  }

  try {
    const uploadPath = path.join(UPLOAD_DIR, uploadId)
    const files = await readdir(uploadPath)
    const chunkFiles = files.filter((f) => f.startsWith('chunk-'))

    // 메타데이터 읽기
    const metaPath = path.join(uploadPath, 'meta.json')
    const metaStat = await stat(metaPath).catch(() => null)
    let meta = { fileName: '', totalChunks: 0 }
    if (metaStat) {
      const { readFile } = await import('fs/promises')
      meta = JSON.parse(await readFile(metaPath, 'utf-8'))
    }

    return NextResponse.json({
      uploadId,
      received: chunkFiles.length,
      total: meta.totalChunks,
      complete: chunkFiles.length === meta.totalChunks,
      fileName: meta.fileName,
    })
  } catch {
    return NextResponse.json(
      { error: '업로드 정보를 찾을 수 없습니다' },
      { status: 404 },
    )
  }
}
