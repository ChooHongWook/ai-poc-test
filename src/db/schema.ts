import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  vector,
} from 'drizzle-orm/pg-core'

export const ragDocuments = pgTable('rag_documents', {
  id: serial('id').primaryKey(),
  fileName: varchar('file_name', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  chunkCount: integer('chunk_count').notNull().default(0),
  embeddingModel: varchar('embedding_model', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const ragChunks = pgTable(
  'rag_chunks',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .notNull()
      .references(() => ragDocuments.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_rag_chunks_embedding')
      .using('ivfflat', table.embedding.op('vector_cosine_ops'))
      .with({ lists: 100 }),
    index('idx_rag_chunks_document_id').on(table.documentId),
  ],
)

export type RagDocumentRow = typeof ragDocuments.$inferSelect
export type NewRagDocumentRow = typeof ragDocuments.$inferInsert
export type RagChunkRow = typeof ragChunks.$inferSelect
export type NewRagChunkRow = typeof ragChunks.$inferInsert
