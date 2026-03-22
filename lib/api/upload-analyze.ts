/**
 * /api/upload-analyze 엔드포인트 API 클라이언트
 * MSW가 인터셉트하거나 실제 Next.js Route Handler로 처리
 */
import type {
  UploadAnalyzeParams,
  UploadAnalyzeResult,
} from '@/lib/mock/upload-analyze'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

export async function analyzeUpload(
  params: UploadAnalyzeParams,
): Promise<UploadAnalyzeResult> {
  const response = await fetch(`${BASE_URL}/api/upload-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json() as Promise<UploadAnalyzeResult>
}
