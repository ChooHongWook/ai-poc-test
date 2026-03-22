/**
 * MSW v2 핸들러 정의
 * POST /api/generate 요청을 가로채서 mock 데이터를 반환
 */
import { http, HttpResponse } from 'msw'
import { generateMockOutput } from './generate'
import type { GenerateParams } from './generate'

export const handlers = [
  // @MX:ANCHOR: POST /api/generate의 MSW 핸들러 - 브라우저/테스트 환경 모두에서 사용
  // @MX:REASON: fetch('/api/generate') 호출의 단일 인터셉트 포인트
  http.post('*/api/generate', async ({ request }) => {
    const params = (await request.json()) as GenerateParams

    const result = await generateMockOutput(params)

    return HttpResponse.json(result)
  }),
]
