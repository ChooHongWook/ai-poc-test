// pgvector 벡터 스토어 - 문서 임베딩 저장 및 유사도 검색
// @MX:ANCHOR: RAG 파이프라인의 벡터 저장/검색 유일 진입점
// @MX:REASON: rag-chain, API 라우트(ingest, query, documents)에서 참조

import { desc, eq, sql } from 'drizzle-orm'
import type { Embeddings } from '@langchain/core/embeddings'
import type { Document } from '@langchain/core/documents'
import { getDb } from '@/src/db/client'
import { ragChunks, ragDocuments } from '@/src/db/schema'
import {
  padEmbedding,
  UNIFIED_DIMENSION,
  type EmbeddingProvider,
} from './embedding-factory'

// 문서 메타데이터 타입
export interface RagDocument {
  id: number
  fileName: string
  fileSize: number
  mimeType: string
  chunkCount: number
  embeddingModel: string
  createdAt: string
}

// 검색 결과 타입
export interface SearchResult {
  content: string
  metadata: Record<string, unknown>
  score: number
  chunkIndex: number
  documentId: number
}

interface SearchRow {
  [key: string]: unknown
  content: string
  metadata: Record<string, unknown>
  chunk_index: number
  document_id: number
  score: number
}

function searchSimilarChunksSql(params: {
  vector: string
  topK: number
  documentIds?: number[]
}) {
  const vector = sql`${params.vector}::vector`

  if (params.documentIds && params.documentIds.length > 0) {
    return sql`
      SELECT
        c.content,
        c.metadata,
        c.chunk_index,
        c.document_id,
        1 - (c.embedding <=> ${vector}) AS score
      FROM rag_chunks c
      WHERE c.document_id = ANY(${params.documentIds})
      ORDER BY c.embedding <=> ${vector}
      LIMIT ${params.topK}
    `
  }

  return sql`
    SELECT
      c.content,
      c.metadata,
      c.chunk_index,
      c.document_id,
      1 - (c.embedding <=> ${vector}) AS score
    FROM rag_chunks c
    ORDER BY c.embedding <=> ${vector}
    LIMIT ${params.topK}
  `
}

/**
 * 문서 메타데이터를 DB에 저장하고 문서 ID 반환
 */
export async function createDocument(params: {
  fileName: string
  fileSize: number
  mimeType: string
  chunkCount: number
  embeddingModel: string
}): Promise<number> {
  const db = getDb()
  const [document] = await db
    .insert(ragDocuments)
    .values(params)
    .returning({ id: ragDocuments.id })

  if (!document) {
    throw new Error('문서 메타데이터 저장에 실패했습니다')
  }

  return document.id
}

/**
 * 문서 청크를 임베딩하여 pgvector에 저장
 * 청크 배열과 임베딩 모델을 받아 벡터 DB에 일괄 저장
 */
export async function storeChunks(params: {
  documentId: number
  chunks: Document[]
  embeddings: Embeddings
  embeddingProvider: EmbeddingProvider
}): Promise<void> {
  const { documentId, chunks, embeddings, embeddingProvider } = params
  const db = getDb()

  // 청크 텍스트 배열에서 임베딩 일괄 생성
  const texts = chunks.map((chunk) => chunk.pageContent)
  const vectors = await embeddings.embedDocuments(texts)

  // 트랜잭션으로 일괄 삽입
  await db.transaction(async (tx) => {
    for (let i = 0; i < chunks.length; i++) {
      const paddedVector = padEmbedding(vectors[i]!, UNIFIED_DIMENSION)

      await tx.insert(ragChunks).values({
        documentId,
        chunkIndex: i,
        content: chunks[i]!.pageContent,
        metadata: {
          ...chunks[i]!.metadata,
          embeddingProvider,
        },
        embedding: paddedVector,
      })
    }
  })
}

/**
 * 쿼리 텍스트로 유사 문서 청크 검색
 * 코사인 유사도 기반 상위 k개 결과 반환
 */
export async function searchSimilarChunks(params: {
  query: string
  embeddings: Embeddings
  embeddingProvider: EmbeddingProvider
  topK?: number
  documentIds?: number[]
}): Promise<SearchResult[]> {
  const { query, embeddings, embeddingProvider, topK = 5, documentIds } = params
  const db = getDb()

  // 쿼리 임베딩 생성
  const queryVector = await embeddings.embedQuery(query)
  const paddedVector = padEmbedding(queryVector, UNIFIED_DIMENSION)
  const vectorStr = `[${paddedVector.join(',')}]`

  const result = await db.execute<SearchRow>(
    searchSimilarChunksSql({ vector: vectorStr, topK, documentIds }),
  )

  return result.rows.map((row) => ({
    content: row.content,
    metadata: row.metadata,
    score: row.score,
    chunkIndex: row.chunk_index,
    documentId: row.document_id,
  }))
}

/**
 * 저장된 문서 목록 조회
 */
export async function listDocuments(): Promise<RagDocument[]> {
  const db = getDb()
  const documents = await db
    .select()
    .from(ragDocuments)
    .orderBy(desc(ragDocuments.createdAt))

  return documents.map((row) => ({
    id: row.id,
    fileName: row.fileName,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    chunkCount: row.chunkCount,
    embeddingModel: row.embeddingModel,
    createdAt: row.createdAt.toISOString(),
  }))
}

/**
 * 문서 삭제 (cascade로 청크도 함께 삭제)
 */
export async function deleteDocument(documentId: number): Promise<void> {
  const db = getDb()
  await db.delete(ragDocuments).where(eq(ragDocuments.id, documentId))
}
