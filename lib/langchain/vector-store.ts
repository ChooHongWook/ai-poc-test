// pgvector 벡터 스토어 - 문서 임베딩 저장 및 유사도 검색
// @MX:ANCHOR: RAG 파이프라인의 벡터 저장/검색 유일 진입점
// @MX:REASON: rag-chain, API 라우트(ingest, query, documents)에서 참조

import pg from 'pg'
import type { Embeddings } from '@langchain/core/embeddings'
import type { Document } from '@langchain/core/documents'
import {
  padEmbedding,
  UNIFIED_DIMENSION,
  type EmbeddingProvider,
} from './embedding-factory'

const { Pool } = pg

// 싱글턴 DB 풀
let pool: pg.Pool | null = null

/**
 * PostgreSQL 커넥션 풀 반환 (싱글턴)
 */
function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다')
    }
    pool = new Pool({ connectionString })
  }
  return pool
}

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
  const db = getPool()
  const result = await db.query<{ id: number }>(
    `INSERT INTO rag_documents (file_name, file_size, mime_type, chunk_count, embedding_model)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      params.fileName,
      params.fileSize,
      params.mimeType,
      params.chunkCount,
      params.embeddingModel,
    ],
  )
  return result.rows[0]!.id
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
  const db = getPool()

  // 청크 텍스트 배열에서 임베딩 일괄 생성
  const texts = chunks.map((chunk) => chunk.pageContent)
  const vectors = await embeddings.embedDocuments(texts)

  // 트랜잭션으로 일괄 삽입
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    for (let i = 0; i < chunks.length; i++) {
      const paddedVector = padEmbedding(vectors[i]!, UNIFIED_DIMENSION)
      const vectorStr = `[${paddedVector.join(',')}]`

      await client.query(
        `INSERT INTO rag_chunks (document_id, chunk_index, content, metadata, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)`,
        [
          documentId,
          i,
          chunks[i]!.pageContent,
          JSON.stringify({
            ...chunks[i]!.metadata,
            embeddingProvider,
          }),
          vectorStr,
        ],
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
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
  const db = getPool()

  // 쿼리 임베딩 생성
  const queryVector = await embeddings.embedQuery(query)
  const paddedVector = padEmbedding(queryVector, UNIFIED_DIMENSION)
  const vectorStr = `[${paddedVector.join(',')}]`

  // 유사도 검색 쿼리
  let sql = `
    SELECT
      c.content,
      c.metadata,
      c.chunk_index,
      c.document_id,
      1 - (c.embedding <=> $1::vector) AS score
    FROM rag_chunks c
  `
  const queryParams: (string | number[])[] = [vectorStr]

  // 특정 문서만 검색하는 필터
  if (documentIds && documentIds.length > 0) {
    sql += ` WHERE c.document_id = ANY($2)`
    queryParams.push(documentIds)
  }

  sql += ` ORDER BY c.embedding <=> $1::vector LIMIT ${topK}`

  const result = await db.query<{
    content: string
    metadata: Record<string, unknown>
    chunk_index: number
    document_id: number
    score: number
  }>(sql, queryParams)

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
  const db = getPool()
  const result = await db.query<{
    id: number
    file_name: string
    file_size: number
    mime_type: string
    chunk_count: number
    embedding_model: string
    created_at: string
  }>(`SELECT * FROM rag_documents ORDER BY created_at DESC`)

  return result.rows.map((row) => ({
    id: row.id,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    chunkCount: row.chunk_count,
    embeddingModel: row.embedding_model,
    createdAt: row.created_at,
  }))
}

/**
 * 문서 삭제 (cascade로 청크도 함께 삭제)
 */
export async function deleteDocument(documentId: number): Promise<void> {
  const db = getPool()
  await db.query(`DELETE FROM rag_documents WHERE id = $1`, [documentId])
}
