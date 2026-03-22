/**
 * /api/upload-analyze 엔드포인트 API 클라이언트
 * MSW가 인터셉트하거나 실제 Next.js Route Handler로 처리
 */
import type { UploadAnalyzeResult } from '@/lib/mock/upload-analyze'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

// @MX:ANCHOR: 파일 업로드 분석 API 클라이언트 - UI에서 호출하는 단일 진입점
// @MX:REASON: page.tsx에서 직접 참조하는 API 경계
export async function analyzeUpload(params: {
  files: File[]
  chatgpt: { enabled: boolean; apiKey: string; model: string }
  gemini: { enabled: boolean; apiKey: string; model: string }
  claude: { enabled: boolean; apiKey: string; model: string }
  systemPrompt: string
  userPrompt: string
  schema: string
}): Promise<UploadAnalyzeResult> {
  // FormData로 파일 + 설정을 함께 전송
  const formData = new FormData()

  // 파일들을 FormData에 추가
  params.files.forEach((file) => formData.append('files', file))

  // 설정을 JSON으로 직렬화하여 추가
  formData.append(
    'config',
    JSON.stringify({
      chatgpt: params.chatgpt,
      gemini: params.gemini,
      claude: params.claude,
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      schema: params.schema,
    }),
  )

  // Content-Type 헤더는 설정하지 않음 (브라우저가 boundary 포함하여 자동 설정)
  const response = await fetch(`${BASE_URL}/api/upload-analyze`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string
    }
    throw new Error(
      errorData.error ?? `API error: ${response.status}`,
    )
  }

  return response.json() as Promise<UploadAnalyzeResult>
}
