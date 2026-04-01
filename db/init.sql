-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- RAG 문서 메타데이터 테이블
CREATE TABLE IF NOT EXISTS rag_documents (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  embedding_model VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG 문서 청크 + 임베딩 테이블
-- OpenAI text-embedding-3-small: 1536차원
-- Google embedding-001: 768차원
-- 최대 차원수인 1536으로 통일 (Google 임베딩은 패딩 처리)
CREATE TABLE IF NOT EXISTS rag_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 벡터 검색용 인덱스 (IVFFlat)
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding
  ON rag_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 문서 ID 기반 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id
  ON rag_chunks (document_id);
