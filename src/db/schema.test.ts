import { getTableColumns, getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { ragChunks, ragDocuments } from './schema'

describe('Drizzle RAG schema', () => {
  it('defines the RAG document table columns used by the vector store', () => {
    const columns = getTableColumns(ragDocuments)

    expect(getTableName(ragDocuments)).toBe('rag_documents')
    expect(Object.keys(columns)).toEqual([
      'id',
      'fileName',
      'fileSize',
      'mimeType',
      'chunkCount',
      'embeddingModel',
      'createdAt',
    ])
  })

  it('defines the RAG chunk table with a pgvector embedding column', () => {
    const columns = getTableColumns(ragChunks)

    expect(getTableName(ragChunks)).toBe('rag_chunks')
    expect(Object.keys(columns)).toEqual([
      'id',
      'documentId',
      'chunkIndex',
      'content',
      'metadata',
      'embedding',
      'createdAt',
    ])
    expect(columns.embedding.getSQLType()).toBe('vector(1536)')
  })
})
