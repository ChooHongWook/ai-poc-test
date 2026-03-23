/**
 * /api/generate 엔드포인트 API 클라이언트
 * MSW가 인터셉트하거나 실제 Next.js Route Handler로 처리
 */
import type { GenerateParams } from '@/lib/mock/generate'
import type { GenerateResult } from '@/lib/mock/generate'

// GenerateParams와 동일하지만 API 레이어에서 명시적으로 re-export
export type { GenerateParams as GenerateRequest }

// 테스트 환경에서는 절대 URL이 필요하므로 baseURL을 환경변수로 설정 가능
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

// @MX:ANCHOR: app/page.tsx에서 호출되는 핵심 API 함수
// @MX:REASON: MSW 인터셉터와 실제 Route Handler 모두를 통해 처리되는 단일 진입점
export async function generateOutput(
  params: GenerateParams,
): Promise<GenerateResult> {
  const response = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json() as Promise<GenerateResult>
}
