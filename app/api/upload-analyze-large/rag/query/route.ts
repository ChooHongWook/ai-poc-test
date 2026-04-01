/**
 * POST /api/upload-analyze-large/rag/query
 * RAG 질의응답 엔드포인트 - SSE 스트리밍 응답
 * 1. 쿼리 임베딩 → 2. 유사 청크 검색 → 3. LLM 답변 생성 (스트리밍)
 */
import {
  createEmbeddings,
  type EmbeddingProvider,
} from '@/lib/langchain/embedding-factory'
import { searchSimilarChunks } from '@/lib/langchain/vector-store'
import { streamRagChain } from '@/lib/langchain/rag-chain'
import { createProviders } from '@/lib/langchain/ai-provider-factory'
import type { AiProviderConfigs } from '@/lib/types'

// SSE 이벤트 헬퍼
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as {
    query: string
    embeddingProvider: EmbeddingProvider
    embeddingApiKey: string
    embeddingModel?: string
    llmProvider: AiProviderConfigs
    documentIds?: number[]
    topK?: number
  }

  const {
    query,
    embeddingProvider,
    embeddingApiKey,
    embeddingModel,
    llmProvider,
    documentIds,
    topK = 5,
  } = body

  if (!query || !embeddingProvider || !embeddingApiKey) {
    return new Response(
      JSON.stringify({ error: '필수 파라미터가 누락되었습니다 (query, embeddingProvider, embeddingApiKey)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // LLM 제공자 확인
  const providers = createProviders(llmProvider)
  if (providers.length === 0) {
    return new Response(
      JSON.stringify({ error: '활성화된 LLM 제공자가 없습니다' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // 첫 번째 활성 제공자 사용
  const activeProvider = providers[0]!

  // SSE 스트림 생성
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)))
      }

      try {
        // 1. 임베딩 모델 생성
        const embeddings = createEmbeddings({
          provider: embeddingProvider,
          apiKey: embeddingApiKey,
          model: embeddingModel,
        })

        send('progress', { stage: 'searching', message: '유사 문서 검색 중...', progress: 20 })

        // 2. 유사 청크 검색
        const sources = await searchSimilarChunks({
          query,
          embeddings,
          embeddingProvider,
          topK,
          documentIds,
        })

        if (sources.length === 0) {
          send('progress', { stage: 'complete', message: '검색 완료', progress: 100 })
          send('result', {
            answer: '제공된 문서에서 관련 정보를 찾을 수 없습니다.',
            sources: [],
            provider: activeProvider.name,
          })
          controller.close()
          return
        }

        // 검색된 소스 전송 (UI에서 오른쪽 패널에 표시)
        send('sources', { sources })
        send('progress', {
          stage: 'generating',
          message: `${activeProvider.name}으로 답변 생성 중...`,
          progress: 50,
        })

        // 3. RAG 체인 스트리밍 실행
        const generator = streamRagChain({
          query,
          sources,
          llm: activeProvider.model,
          providerName: activeProvider.name,
        })

        for await (const token of generator) {
          send('token', { content: token })
        }

        // 4. 완료
        send('progress', { stage: 'complete', message: '답변 생성 완료', progress: 100 })
        send('done', { provider: activeProvider.name })
      } catch (error) {
        send('error', {
          message: error instanceof Error ? error.message : 'RAG 질의 중 오류가 발생했습니다',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
