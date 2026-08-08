// POST /api/test-key/batch-status Route Handler
// @MX:ANCHOR: 배치 잡 상태 조회의 유일한 진입점
// @MX:REASON: ProviderCard 폴링이 반복 호출하는 계약. 응답 형태 변경 시 UI 폴링이 깨짐
//
// GET이 아닌 POST인 이유: apiKey를 URL 쿼리에 실으면 서버·프록시 접근 로그에
// 평문으로 남는다. 본문으로 받아 로그 노출 경로를 차단한다.

import { NextResponse } from 'next/server'
import { BatchStatusRequestSchema } from '../_validate'
import { pollBatchJobs } from '../_batch-adapters'
import type { BatchStatusResponse } from '../_validate'

export async function POST(request: Request): Promise<NextResponse> {
  // 요청 본문 파싱 및 스키마 검증
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 형식입니다.' }, { status: 400 })
  }

  const parsed = BatchStatusRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: '요청 형식이 올바르지 않습니다.', details: parsed.error.issues },
      { status: 422 },
    )
  }

  const { provider, apiKey, jobs } = parsed.data

  const polled = await pollBatchJobs(provider, apiKey, jobs)
  return NextResponse.json<BatchStatusResponse>({ jobs: polled })
}
