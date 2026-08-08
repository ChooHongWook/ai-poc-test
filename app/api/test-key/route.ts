// POST /api/test-key Route Handler
// @MX:ANCHOR: test-key API의 유일한 진입점
// @MX:REASON: _validate 스키마 검증 후 _adapters로 위임. 외부에서 POST로 호출됨

import { NextResponse } from 'next/server'
import { TestKeyRequestSchema } from './_validate'
import { runQuickCheck, runPingCheck } from './_adapters'
import { submitBatchJobs } from './_batch-adapters'
import type { TestKeyResponse } from './_validate'

/**
 * API Key 검증 요청 처리
 * - quick 모드: 인증 엔드포인트 빠른 확인만 수행
 * - ping 모드: 인증 확인 후 지정 모델 실제 호출 테스트
 * - batch 모드: 인증 확인 후 모델별 배치 잡 제출 (결과는 batch-status에서 폴링)
 */
export async function POST(request: Request): Promise<NextResponse> {
  // 요청 본문 파싱 및 스키마 검증
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 형식입니다.' }, { status: 400 })
  }

  const parsed = TestKeyRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: '요청 형식이 올바르지 않습니다.', details: parsed.error.issues },
      { status: 422 },
    )
  }

  const { provider, apiKey, mode, models } = parsed.data

  // quick 모드: 인증 확인만 수행
  if (mode === 'quick') {
    const result = await runQuickCheck(provider, apiKey)
    return NextResponse.json<TestKeyResponse>(result)
  }

  // ping/batch 모드 공통: 먼저 인증을 확인해 무효한 키로 외부 호출을 낭비하지 않음
  const quickResult = await runQuickCheck(provider, apiKey)
  if (!quickResult.keyValid) {
    return NextResponse.json<TestKeyResponse>(quickResult)
  }

  // batch 모드: 모델별 배치 잡 제출 후 jobId 반환 (실제 과금 발생)
  if (mode === 'batch') {
    const batchJobs = await submitBatchJobs(provider, apiKey, models)
    return NextResponse.json<TestKeyResponse>({ keyValid: true, batchJobs })
  }

  const pingResults = await runPingCheck(provider, apiKey, models)
  return NextResponse.json<TestKeyResponse>({
    keyValid: true,
    results: pingResults,
  })
}
