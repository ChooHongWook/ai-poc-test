// LangChain.js 서비스 레이어 타입 정의
// @MX:ANCHOR: 이 파일의 타입들은 document-loader, ai-provider-factory, analysis-chain에서 공통 참조
// @MX:REASON: 3개 이상의 모듈에서 fan_in >= 3 참조

import type { Document } from '@langchain/core/documents'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { ZodSchema } from 'zod'

// 지원하는 파일 타입
export type SupportedFileType = 'pdf' | 'csv' | 'txt' | 'md'

// 지원하는 MIME 타입 매핑
export type SupportedMimeType =
  | 'application/pdf'
  | 'text/csv'
  | 'text/plain'
  | 'text/markdown'

// 파일 분석 입력 데이터
export interface FileAnalysisInput {
  buffer: Buffer
  mimeType: string
  fileName: string
}

// AI 제공자 설정
export interface ProviderConfig {
  name: string
  model: BaseChatModel
}

// AI 제공자 분석 결과
export interface ProviderResult {
  provider: string
  success: boolean
  structuredOutput?: Record<string, unknown>
  error?: string
}

// 문서 분석 요청
export interface AnalysisRequest {
  documents: Document[]
  providers: ProviderConfig[]
  systemPrompt?: string
  userPrompt?: string
  schema?: ZodSchema
}

// 문서 분석 응답
export interface AnalysisResponse {
  results: ProviderResult[]
  truncated?: boolean
}

// 지원하지 않는 파일 형식 에러
export class UnsupportedFileTypeError extends Error {
  constructor(mimeType: string) {
    super(`지원하지 않는 파일 형식입니다: ${mimeType}`)
    this.name = 'UnsupportedFileTypeError'
  }
}
