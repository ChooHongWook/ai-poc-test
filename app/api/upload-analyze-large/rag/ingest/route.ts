/**
 * POST /api/upload-analyze-large/rag/ingest
 * 업로드된 파일을 청크 분할 → 임베딩 → pgvector 저장
 * SSE로 진행 상태를 실시간 전송
 */
import { readdir, readFile, rm } from 'fs/promises'
import path from 'path'
import os from 'os'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { loadDocument } from '@/lib/langchain/document-loader'
import {
  createEmbeddings,
  type EmbeddingProvider,
} from '@/lib/langchain/embedding-factory'
import {
  createDocument,
  storeChunks,
} from '@/lib/langchain/vector-store'

const UPLOAD_DIR = path.join(os.tmpdir(), 'ai-poc-uploads')

// MIME 타입 추론
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
  }
  return mimeMap[ext] ?? 'text/plain'
}

// SSE 이벤트 헬퍼
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as {
    uploadId: string
    embeddingProvider: EmbeddingProvider
    embeddingApiKey: string
    embeddingModel?: string
    chunkSize?: number
    chunkOverlap?: number
  }

  const {
    uploadId,
    embeddingProvider,
    embeddingApiKey,
    embeddingModel,
    chunkSize = 1000,
    chunkOverlap = 200,
  } = body

  if (!uploadId || !embeddingProvider || !embeddingApiKey) {
    return new Response(
      JSON.stringify({ error: '필수 파라미터가 누락되었습니다 (uploadId, embeddingProvider, embeddingApiKey)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // SSE 스트림 생성
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)))
      }

      try {
        // 1. 업로드된 청크 파일 읽기 및 조립
        send('progress', { stage: 'reading', message: '파일 읽는 중...', progress: 5 })

        const uploadPath = path.join(UPLOAD_DIR, uploadId)
        const metaRaw = await readFile(path.join(uploadPath, 'meta.json'), 'utf-8')
        const meta = JSON.parse(metaRaw) as { fileName: string; totalChunks: number }

        const chunkBuffers: Buffer[] = []
        for (let i = 0; i < meta.totalChunks; i++) {
          const chunkPath = path.join(uploadPath, `chunk-${String(i).padStart(6, '0')}`)
          chunkBuffers.push(await readFile(chunkPath))
        }
        const fullBuffer = Buffer.concat(chunkBuffers)

        send('progress', {
          stage: 'reading',
          message: `파일 로드 완료 (${(fullBuffer.length / 1024 / 1024).toFixed(1)}MB)`,
          progress: 15,
        })

        // 2. 문서 로딩 (Buffer → Document[])
        const mimeType = getMimeType(meta.fileName)
        const documents = await loadDocument({
          buffer: fullBuffer,
          mimeType,
          fileName: meta.fileName,
        })

        send('progress', {
          stage: 'splitting',
          message: `문서 로드 완료 (${documents.length}페이지)`,
          progress: 25,
        })

        // 3. 텍스트 분할
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize,
          chunkOverlap,
        })
        const chunks = await splitter.splitDocuments(documents)

        send('progress', {
          stage: 'splitting',
          message: `${chunks.length}개 청크로 분할 완료`,
          progress: 35,
        })

        // 4. 임베딩 모델 생성
        const embeddings = createEmbeddings({
          provider: embeddingProvider,
          apiKey: embeddingApiKey,
          model: embeddingModel,
        })

        // 5. DB에 문서 메타데이터 저장
        const documentId = await createDocument({
          fileName: meta.fileName,
          fileSize: fullBuffer.length,
          mimeType,
          chunkCount: chunks.length,
          embeddingModel: embeddingModel ?? (embeddingProvider === 'openai' ? 'text-embedding-3-small' : 'text-embedding-004'),
        })

        send('progress', {
          stage: 'embedding',
          message: `임베딩 생성 중... (${chunks.length}개 청크)`,
          progress: 45,
        })

        // 6. 청크 임베딩 + pgvector 저장 (배치 처리)
        const BATCH_SIZE = 20
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batch = chunks.slice(i, i + BATCH_SIZE)
          await storeChunks({
            documentId,
            chunks: batch,
            embeddings,
            embeddingProvider,
          })

          const progress = 45 + ((i + batch.length) / chunks.length) * 50
          send('progress', {
            stage: 'embedding',
            message: `임베딩 저장 중... (${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length})`,
            progress: Math.round(progress),
          })
        }

        // 7. 완료
        send('progress', { stage: 'complete', message: '인제스트 완료', progress: 100 })
        send('result', {
          documentId,
          fileName: meta.fileName,
          fileSize: fullBuffer.length,
          chunkCount: chunks.length,
          embeddingModel: embeddingModel ?? (embeddingProvider === 'openai' ? 'text-embedding-3-small' : 'text-embedding-004'),
        })

        // 8. 임시 업로드 파일 정리
        await rm(uploadPath, { recursive: true, force: true }).catch(() => {})
      } catch (error) {
        send('error', {
          message: error instanceof Error ? error.message : '인제스트 중 오류가 발생했습니다',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
