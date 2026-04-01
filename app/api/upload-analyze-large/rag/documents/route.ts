/**
 * GET /api/upload-analyze-large/rag/documents
 * 저장된 RAG 문서 목록 조회
 *
 * DELETE /api/upload-analyze-large/rag/documents?id=N
 * 특정 문서 삭제 (cascade로 청크 + 임베딩 함께 삭제)
 */
import { NextResponse } from 'next/server'
import { listDocuments, deleteDocument } from '@/lib/langchain/vector-store'

export async function GET(): Promise<NextResponse> {
  try {
    const documents = await listDocuments()
    return NextResponse.json({ documents })
  } catch (error) {
    console.error('[rag/documents] 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '문서 목록을 조회할 수 없습니다' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: '문서 ID가 필요합니다' },
      { status: 400 },
    )
  }

  try {
    await deleteDocument(Number(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[rag/documents] 삭제 오류:', error)
    return NextResponse.json(
      { error: '문서를 삭제할 수 없습니다' },
      { status: 500 },
    )
  }
}
