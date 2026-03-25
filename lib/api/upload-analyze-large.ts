/**
 * 대용량 파일 업로드 + SSE 분석 클라이언트 API
 * 파일을 5MB 청크로 분할 업로드 후, SSE로 Map-Reduce 분석 진행률 수신
 */
import type { AiConfig } from '@/lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

// 청크 크기: 5MB
const CHUNK_SIZE = 5 * 1024 * 1024

// 업로드 진행률 콜백
export interface UploadProgress {
  fileName: string
  chunkIndex: number
  totalChunks: number
  percent: number
}

// SSE 분석 진행 이벤트
export interface AnalyzeProgress {
  stage: 'reading' | 'chunking' | 'analyzing' | 'reducing' | 'complete'
  message: string
  provider?: string
  progress: number
}

// SSE 분석 결과 이벤트
export interface AnalyzeResult {
  results: Array<{
    provider: string
    success: boolean
    structuredOutput?: Record<string, unknown>
    error?: string
  }>
  fileName: string
  fileSize: number
  chunks: number
}

/**
 * 파일을 5MB 청크로 분할하여 업로드
 * 진행률 콜백으로 업로드 상태 전달
 */
export async function uploadFileChunked(
  file: File,
  uploadId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<{ uploadId: string; complete: boolean }> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const formData = new FormData()
    formData.append('uploadId', uploadId)
    formData.append('chunkIndex', String(i))
    formData.append('totalChunks', String(totalChunks))
    formData.append('fileName', file.name)
    formData.append('chunk', chunk)

    const response = await fetch(`${BASE_URL}/api/upload-analyze-large/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: string
      }
      throw new Error(errorData.error ?? `업로드 실패: ${response.status}`)
    }

    onProgress?.({
      fileName: file.name,
      chunkIndex: i,
      totalChunks,
      percent: Math.round(((i + 1) / totalChunks) * 100),
    })
  }

  return { uploadId, complete: true }
}

/**
 * SSE 기반 분석 실행
 * 업로드 완료된 파일에 대해 Map-Reduce 분석을 SSE로 수신
 */
export function startAnalysis(params: {
  uploadId: string
  chatgpt: AiConfig
  gemini: AiConfig
  claude: AiConfig
  systemPrompt: string
  userPrompt: string
  schema: string
  onProgress: (progress: AnalyzeProgress) => void
  onResult: (result: AnalyzeResult) => void
  onError: (error: string) => void
}): AbortController {
  const controller = new AbortController()

  const body = JSON.stringify({
    uploadId: params.uploadId,
    config: {
      chatgpt: params.chatgpt,
      gemini: params.gemini,
      claude: params.claude,
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      schema: params.schema,
    },
  })

  fetch(`${BASE_URL}/api/upload-analyze-large/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string
        }
        params.onError(errorData.error ?? `분석 실패: ${response.status}`)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        params.onError('스트림을 읽을 수 없습니다')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE 이벤트 파싱
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (currentEvent === 'progress') {
              params.onProgress(data as AnalyzeProgress)
            } else if (currentEvent === 'result') {
              params.onResult(data as AnalyzeResult)
            } else if (currentEvent === 'error') {
              params.onError((data as { message: string }).message)
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error instanceof Error && error.name !== 'AbortError') {
        params.onError(error.message)
      }
    })

  return controller
}

/**
 * 고유한 업로드 ID 생성
 */
export function generateUploadId(): string {
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
