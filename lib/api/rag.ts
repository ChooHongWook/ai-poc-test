/**
 * RAG 클라이언트 API - 프론트엔드에서 RAG 엔드포인트 호출
 * 인제스트(SSE), 질의(SSE 스트리밍), 문서 목록/삭제 지원
 */
import type { AiConfig } from '@/lib/types'
import type { EmbeddingProvider } from '@/lib/langchain/embedding-factory'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

// ── 문서 목록 관련 타입 ──

export interface RagDocument {
  id: number
  fileName: string
  fileSize: number
  mimeType: string
  chunkCount: number
  embeddingModel: string
  createdAt: string
}

// ── 인제스트 관련 타입 ──

export interface IngestProgress {
  stage: 'reading' | 'splitting' | 'embedding' | 'complete'
  message: string
  progress: number
}

export interface IngestResult {
  documentId: number
  fileName: string
  fileSize: number
  chunkCount: number
  embeddingModel: string
}

// ── 질의 관련 타입 ──

export interface SearchSource {
  content: string
  metadata: Record<string, unknown>
  score: number
  chunkIndex: number
  documentId: number
}

// ── 채팅 메시지 타입 ──

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SearchSource[]
  provider?: string
  timestamp: Date
}

// ── 문서 목록 API ──

export async function fetchDocuments(): Promise<RagDocument[]> {
  const response = await fetch(`${BASE_URL}/api/upload-analyze-large/rag/documents`)
  if (!response.ok) throw new Error('문서 목록 조회 실패')
  const data = (await response.json()) as { documents: RagDocument[] }
  return data.documents
}

export async function removeDocument(id: number): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/api/upload-analyze-large/rag/documents?id=${id}`,
    { method: 'DELETE' },
  )
  if (!response.ok) throw new Error('문서 삭제 실패')
}

// ── 인제스트 API (SSE) ──

export function startIngest(params: {
  uploadId: string
  embeddingProvider: EmbeddingProvider
  embeddingApiKey: string
  embeddingModel?: string
  chunkSize?: number
  chunkOverlap?: number
  onProgress: (progress: IngestProgress) => void
  onResult: (result: IngestResult) => void
  onError: (error: string) => void
}): AbortController {
  const controller = new AbortController()

  fetch(`${BASE_URL}/api/upload-analyze-large/rag/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId: params.uploadId,
      embeddingProvider: params.embeddingProvider,
      embeddingApiKey: params.embeddingApiKey,
      embeddingModel: params.embeddingModel,
      chunkSize: params.chunkSize,
      chunkOverlap: params.chunkOverlap,
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string }
        params.onError(errorData.error ?? `인제스트 실패: ${response.status}`)
        return
      }
      await parseSSEStream(response, {
        progress: (data) => params.onProgress(data as IngestProgress),
        result: (data) => params.onResult(data as IngestResult),
        error: (data) => params.onError((data as { message: string }).message),
      })
    })
    .catch((error) => {
      if (error instanceof Error && error.name !== 'AbortError') {
        params.onError(error.message)
      }
    })

  return controller
}

// ── 질의 API (SSE 스트리밍) ──

export function startQuery(params: {
  query: string
  embeddingProvider: EmbeddingProvider
  embeddingApiKey: string
  embeddingModel?: string
  chatgpt: AiConfig
  gemini: AiConfig
  claude: AiConfig
  documentIds?: number[]
  topK?: number
  onProgress: (progress: { stage: string; message: string; progress: number }) => void
  onSources: (sources: SearchSource[]) => void
  onToken: (token: string) => void
  onDone: (provider: string) => void
  onError: (error: string) => void
}): AbortController {
  const controller = new AbortController()

  fetch(`${BASE_URL}/api/upload-analyze-large/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: params.query,
      embeddingProvider: params.embeddingProvider,
      embeddingApiKey: params.embeddingApiKey,
      embeddingModel: params.embeddingModel,
      llmProvider: {
        chatgpt: params.chatgpt,
        gemini: params.gemini,
        claude: params.claude,
      },
      documentIds: params.documentIds,
      topK: params.topK,
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string }
        params.onError(errorData.error ?? `질의 실패: ${response.status}`)
        return
      }
      await parseSSEStream(response, {
        progress: (data) => params.onProgress(data as { stage: string; message: string; progress: number }),
        sources: (data) => params.onSources((data as { sources: SearchSource[] }).sources),
        token: (data) => params.onToken((data as { content: string }).content),
        done: (data) => params.onDone((data as { provider: string }).provider),
        error: (data) => params.onError((data as { message: string }).message),
      })
    })
    .catch((error) => {
      if (error instanceof Error && error.name !== 'AbortError') {
        params.onError(error.message)
      }
    })

  return controller
}

// ── SSE 스트림 파서 (공통) ──

async function parseSSEStream(
  response: Response,
  handlers: Record<string, (data: unknown) => void>,
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    let currentEvent = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7)
      } else if (line.startsWith('data: ') && currentEvent) {
        const data = JSON.parse(line.slice(6))
        handlers[currentEvent]?.(data)
      }
    }
  }
}

// ── 유틸리티 ──

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}
