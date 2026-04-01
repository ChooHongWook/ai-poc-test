// 멀티 임베딩 팩토리 - OpenAI / Google 임베딩 선택 생성
// @MX:ANCHOR: RAG 체인과 벡터 스토어에서 임베딩 인스턴스를 얻는 유일한 진입점
// @MX:REASON: vector-store, rag-chain, API 라우트에서 참조

import { OpenAIEmbeddings } from '@langchain/openai'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import type { Embeddings } from '@langchain/core/embeddings'

// 지원하는 임베딩 제공자 타입
export type EmbeddingProvider = 'openai' | 'google'

// 임베딩 생성 설정
export interface EmbeddingConfig {
  provider: EmbeddingProvider
  apiKey: string
  model?: string
}

// 임베딩 차원수 매핑
export const EMBEDDING_DIMENSIONS: Record<EmbeddingProvider, number> = {
  openai: 1536, // text-embedding-3-small 기본 차원
  google: 768, // embedding-001 기본 차원
}

// DB 통일 차원수 (가장 큰 차원으로 맞춤)
export const UNIFIED_DIMENSION = 1536

/**
 * 임베딩 제공자 인스턴스 생성
 * provider에 따라 OpenAI 또는 Google 임베딩 반환
 */
export function createEmbeddings(config: EmbeddingConfig): Embeddings {
  switch (config.provider) {
    case 'openai':
      return new OpenAIEmbeddings({
        model: config.model ?? 'text-embedding-3-small',
        apiKey: config.apiKey,
      })

    case 'google':
      return new GoogleGenerativeAIEmbeddings({
        model: config.model ?? 'text-embedding-004',
        apiKey: config.apiKey,
      })

    default:
      throw new Error(`지원하지 않는 임베딩 제공자: ${config.provider}`)
  }
}

/**
 * 임베딩 벡터를 통일 차원(1536)으로 패딩
 * Google 임베딩(768차원)은 뒤에 0을 채워 1536차원으로 확장
 */
export function padEmbedding(
  embedding: number[],
  targetDimension: number = UNIFIED_DIMENSION,
): number[] {
  if (embedding.length >= targetDimension) {
    return embedding.slice(0, targetDimension)
  }
  return [...embedding, ...new Array(targetDimension - embedding.length).fill(0)]
}
