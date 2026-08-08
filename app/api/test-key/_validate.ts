// API Key 테스트 요청 Zod 스키마 및 타입 정의
// @MX:ANCHOR: POST /api/test-key 요청 본문의 유일한 검증 진입점
// @MX:REASON: route.ts와 _adapters.ts에서 참조하는 공유 계약

import { z } from 'zod'

// 지원 제공자 식별자 - 설정 페이지 제공자 카드와 일치
export const ProviderEnum = z.enum(['chatgpt', 'gemini', 'claude'])

// 테스트 모드 - quick: 인증만, ping: 실제 모델 호출, batch: 배치 잡 제출
export const ModeEnum = z.enum(['quick', 'ping', 'batch'])

// 제공자 식별자 타입 - ProviderEnum을 단일 진실 공급원으로 재사용
export type Provider = z.infer<typeof ProviderEnum>

/**
 * POST /api/test-key 요청 본문 스키마
 * - provider: AI 제공자 식별자
 * - apiKey: 카드 입력값(localStorage 출처) — 평문으로 로그/응답에 절대 포함 불가
 * - mode: 테스트 방식 선택
 * - models: ping/batch 모드에서 호출할 모델 목록 (quick 모드에서는 무시됨)
 *
 * batch 모드는 모델 1개당 배치 잡 1개를 만들므로 빈 목록을 허용하지 않음
 */
export const TestKeyRequestSchema = z
  .object({
    provider: ProviderEnum,
    apiKey: z.string().min(1, 'apiKey는 비어 있을 수 없습니다'),
    mode: ModeEnum,
    models: z.array(z.string()),
  })
  .refine((data) => data.mode !== 'batch' || data.models.length > 0, {
    message: 'batch 모드에서는 최소 1개 모델을 선택해야 합니다',
    path: ['models'],
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

// ── 배치(Batch) 타입 ──────────────────────────────────────

/**
 * 배치 잡 상태 - provider별 원시 상태값을 3종으로 정규화
 * - pending: 제출됨, 아직 처리 중 (폴링 계속)
 * - succeeded: 처리 완료 + 결과 수집 성공 (폴링 종료)
 * - failed: 제출 실패 또는 처리 실패/만료/취소 (폴링 종료)
 */
export const BatchJobStatusEnum = z.enum(['pending', 'succeeded', 'failed'])
export type BatchJobStatus = z.infer<typeof BatchJobStatusEnum>

/**
 * 배치 잡 1건 (모델 1개 = 잡 1개)
 * - jobId: 제출 성공 시 provider가 발급한 식별자. 제출 실패 시 null
 * - rawStatus: provider 원시 상태 문자열 (디버깅용 표시)
 * - submittedAt/completedAt: ISO 8601 문자열
 *   폴링 관측 시각은 최대 폴링 주기만큼 오차가 나므로 provider가 보고한 시각을
 *   우선 사용하고, provider가 값을 주지 않을 때만 서버 관측 시각으로 대체한다
 */
export interface BatchJob {
  model: string
  jobId: string | null
  status: BatchJobStatus
  rawStatus?: string
  preview?: string
  error?: string
  submittedAt?: string
  completedAt?: string
}

// 제공자 테스트 응답 계약
export interface TestKeyResponse {
  keyValid: boolean
  keyError?: string
  results?: ModelTestResult[]
  batchJobs?: BatchJob[]
}

/**
 * POST /api/test-key/batch-status 요청 본문 스키마
 * apiKey를 URL 쿼리가 아닌 본문으로 받는 이유: 쿼리스트링은 서버·프록시 로그에
 * 평문으로 남기 때문에 GET이 아닌 POST로 설계함
 */
export const BatchStatusRequestSchema = z.object({
  provider: ProviderEnum,
  apiKey: z.string().min(1, 'apiKey는 비어 있을 수 없습니다'),
  jobs: z
    .array(
      z.object({
        model: z.string().min(1),
        jobId: z.string().min(1),
      }),
    )
    .min(1, '조회할 배치 잡이 최소 1개 필요합니다'),
})

export type BatchStatusRequest = z.infer<typeof BatchStatusRequestSchema>

// 배치 상태 조회 응답 계약
export interface BatchStatusResponse {
  jobs: BatchJob[]
}
