/**
 * MSW v2 핸들러 정의
 * POST /api/generate 요청을 가로채서 mock 데이터를 반환
 */
import { http, HttpResponse } from 'msw'
import { generateMockOutput } from './generate'
import type { GenerateParams } from './generate'
import { analyzeUploadedFiles } from './upload-analyze'
import type { UploadAnalyzeParams } from './upload-analyze'

export const handlers = [
  // @MX:ANCHOR: POST /api/generate의 MSW 핸들러 - 브라우저/테스트 환경 모두에서 사용
  // @MX:REASON: fetch('/api/generate') 호출의 단일 인터셉트 포인트
  http.post('*/api/generate', async ({ request }) => {
    const params = (await request.json()) as GenerateParams

    const result = await generateMockOutput(params)

    return HttpResponse.json(result)
  }),

  // @MX:ANCHOR: POST /api/upload-analyze의 MSW 핸들러 - 파일 업로드 분석 테스트
  // @MX:REASON: fetch('/api/upload-analyze') 호출의 단일 인터셉트 포인트
  http.post('*/api/upload-analyze', async ({ request }) => {
    // FormData로 전송된 파일과 설정을 파싱
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const configRaw = formData.get('config')
    const config = JSON.parse(
      typeof configRaw === 'string' ? configRaw : '{}',
    ) as Omit<UploadAnalyzeParams, 'fileNames' | 'fileSizes' | 'fileTypes'>

    // File 객체에서 메타데이터 추출하여 기존 mock 함수에 전달
    const params: UploadAnalyzeParams = {
      ...config,
      fileNames: files.map((f) => f.name),
      fileSizes: files.map((f) => `${(f.size / 1024).toFixed(1)}KB`),
      fileTypes: files.map((f) => f.type),
    }

    const result = await analyzeUploadedFiles(params)

    return HttpResponse.json(result)
  }),
]
