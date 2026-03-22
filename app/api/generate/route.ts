/**
 * POST /api/generate Route Handler
 * MSW가 비활성화된 환경(프로덕션/서버)에서의 폴백 핸들러
 * generateMockOutput을 재사용하여 동일한 mock 데이터를 반환
 */
import { NextResponse } from 'next/server'
import { generateMockOutput } from '@/lib/mock/generate'
import type { GenerateParams } from '@/lib/mock/generate'

export async function POST(request: Request) {
  const params = (await request.json()) as GenerateParams

  const result = await generateMockOutput(params)

  return NextResponse.json(result)
}
