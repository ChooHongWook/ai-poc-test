// API Key 테스트 요청 Zod 스키마 및 타입 정의
// @MX:ANCHOR: POST /api/test-key 요청 본문의 유일한 검증 진입점
// @MX:REASON: route.ts와 _adapters.ts에서 참조하는 공유 계약

import { z } from 'zod'

// 지원 제공자 식별자 - 설정 페이지 제공자 카드와 일치
export const ProviderEnum = z.enum(['chatgpt', 'gemini', 'claude'])

// 테스트 모드 - quick: 인증만, ping: 실제 모델 호출
export const ModeEnum = z.enum(['quick', 'ping'])

// 제공자 식별자 타입 - ProviderEnum을 단일 진실 공급원으로 재사용
export type Provider = z.infer<typeof ProviderEnum>

/**
 * POST /api/test-key 요청 본문 스키마
 * - provider: AI 제공자 식별자
 * - apiKey: 카드 입력값(localStorage 출처) — 평문으로 로그/응답에 절대 포함 불가
 * - mode: 테스트 방식 선택
 * - models: ping 모드에서 호출할 모델 목록 (quick 모드에서는 무시됨)
 */
export const TestKeyRequestSchema = z.object({
  provider: ProviderEnum,
  apiKey: z.string().min(1, 'apiKey는 비어 있을 수 없습니다'),
  mode: ModeEnum,
  models: z.array(z.string()),
})

export type TestKeyRequest = z.infer<typeof TestKeyRequestSchema>

// ── 응답 타입 ─────────────────────────────────────────────────

// 단일 모델 ping 결과
export interface ModelTestResult {
  model: string
  success: boolean
  latencyMs: number
  preview?: string
  error?: string
}

// 제공자 테스트 응답 계약
export interface TestKeyResponse {
  keyValid: boolean
  keyError?: string
  results?: ModelTestResult[]
}
