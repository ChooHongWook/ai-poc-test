/**
 * POST /api/upload-analyze-large/analyze
 * SSE 기반 대용량 파일 Map-Reduce 분석 엔드포인트
 * 업로드된 청크를 스트림으로 읽어 AI 분석 수행
 */
import { readdir, readFile, rm } from 'fs/promises'
import path from 'path'
import os from 'os'
import { Document } from '@langchain/core/documents'
import { createProviders } from '@/lib/langchain/ai-provider-factory'
import { jsonSchemaToZod } from '@/lib/langchain/schema-converter'
import type { UploadAnalyzeConfig } from '@/lib/types'
import type { ProviderConfig, ProviderResult } from '@/lib/langchain/types'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'

const UPLOAD_DIR = path.join(os.tmpdir(), 'ai-poc-uploads')

// Map 단계에서 사용할 청크 크기 (약 10,000자 = 약 3,000 토큰)
const CHUNK_SIZE = 10_000

// 기본 스키마
const DEFAULT_SCHEMA = z.object({
  분석결과: z.string().describe('분석 결과 텍스트'),
})

// SSE 이벤트 전송 헬퍼
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

// 텍스트를 청크로 분할
function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks
}

// Map 단계: 단일 청크를 AI로 분석
async function analyzeChunk(
  provider: ProviderConfig,
  chunkText: string,
  chunkIndex: number,
  totalChunks: number,
  systemPrompt: string,
  userPrompt: string,
  schema?: ReturnType<typeof jsonSchemaToZod>,
): Promise<Record<string, unknown>> {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `{systemPrompt}\n\n이것은 전체 문서의 일부입니다 (청크 {chunkIndex}/{totalChunks}).\n\n{context}`,
    ],
    ['human', '{userPrompt}'],
  ])

  const effectiveSchema = schema ?? DEFAULT_SCHEMA
  const chain = prompt.pipe(provider.model.withStructuredOutput(effectiveSchema))

  const result = await chain.invoke({
    systemPrompt,
    userPrompt,
    context: chunkText,
    chunkIndex: String(chunkIndex + 1),
    totalChunks: String(totalChunks),
  })

  return result as Record<string, unknown>
}

// Reduce 단계: 부분 결과들을 종합
async function reduceResults(
  provider: ProviderConfig,
  partialResults: Record<string, unknown>[],
  systemPrompt: string,
  userPrompt: string,
  schema?: ReturnType<typeof jsonSchemaToZod>,
): Promise<Record<string, unknown>> {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `{systemPrompt}\n\n아래는 대용량 문서를 여러 청크로 나눠 분석한 부분 결과들입니다. 이를 종합하여 최종 분석 결과를 생성하세요.\n\n{partialResults}`,
    ],
    ['human', '{userPrompt}'],
  ])

  const effectiveSchema = schema ?? DEFAULT_SCHEMA
  const chain = prompt.pipe(provider.model.withStructuredOutput(effectiveSchema))

  const result = await chain.invoke({
    systemPrompt,
    userPrompt,
    partialResults: JSON.stringify(partialResults, null, 2),
  })

  return result as Record<string, unknown>
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as {
    uploadId: string
    config: UploadAnalyzeConfig
  }

  const { uploadId, config } = body
  const { chatgpt, gemini, claude } = config

  // AI 제공자 검증
  const hasProvider =
    (chatgpt?.enabled && chatgpt?.apiKey) ||
    (gemini?.enabled && gemini?.apiKey) ||
    (claude?.enabled && claude?.apiKey)

  if (!hasProvider) {
    return new Response(
      JSON.stringify({ error: '활성화된 AI 제공자가 없습니다' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const providers = createProviders({ chatgpt, gemini, claude })
  const schema = config.schema ? jsonSchemaToZod(config.schema) : undefined

  // SSE 스트림 생성
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)))
      }

      try {
        // 1. 청크 파일 읽기 및 조립
        send('progress', { stage: 'reading', message: '파일 읽는 중...', progress: 5 })

        const uploadPath = path.join(UPLOAD_DIR, uploadId)
        const metaRaw = await readFile(path.join(uploadPath, 'meta.json'), 'utf-8')
        const meta = JSON.parse(metaRaw) as { fileName: string; totalChunks: number }

        // 청크 파일들을 순서대로 읽어 합침
        const chunkBuffers: Buffer[] = []
        for (let i = 0; i < meta.totalChunks; i++) {
          const chunkPath = path.join(uploadPath, `chunk-${String(i).padStart(6, '0')}`)
          chunkBuffers.push(await readFile(chunkPath))
        }
        const fullBuffer = Buffer.concat(chunkBuffers)
        const fullText = fullBuffer.toString('utf-8')

        send('progress', {
          stage: 'reading',
          message: `파일 로드 완료 (${(fullBuffer.length / 1024 / 1024).toFixed(1)}MB)`,
          progress: 10,
        })

        // 2. 텍스트 청킹
        const textChunks = splitIntoChunks(fullText, CHUNK_SIZE)
        send('progress', {
          stage: 'chunking',
          message: `${textChunks.length}개 청크로 분할`,
          progress: 15,
        })

        const systemPrompt =
          config.systemPrompt ||
          '당신은 문서 분석 전문가입니다. 주어진 문서를 분석하여 핵심 내용을 추출하세요.'
        const userPrompt = config.userPrompt || '다음 문서를 분석해주세요.'

        // 3. 각 제공자별 Map-Reduce 실행
        const allResults: ProviderResult[] = []
        const providerWeight = 80 / providers.length

        for (let pi = 0; pi < providers.length; pi++) {
          const provider = providers[pi]!
          const baseProgress = 15 + pi * providerWeight

          send('progress', {
            stage: 'analyzing',
            message: `${provider.name} 분석 시작...`,
            provider: provider.name,
            progress: Math.round(baseProgress),
          })

          try {
            // Map 단계: 각 청크를 병렬 분석 (동시 3개 제한)
            const partialResults: Record<string, unknown>[] = []
            const concurrency = 3

            for (let i = 0; i < textChunks.length; i += concurrency) {
              const batch = textChunks.slice(i, i + concurrency)
              const batchResults = await Promise.all(
                batch.map((chunk, j) =>
                  analyzeChunk(
                    provider,
                    chunk,
                    i + j,
                    textChunks.length,
                    systemPrompt,
                    userPrompt,
                    schema,
                  ),
                ),
              )
              partialResults.push(...batchResults)

              const chunkProgress =
                baseProgress +
                ((i + batch.length) / textChunks.length) * providerWeight * 0.7
              send('progress', {
                stage: 'analyzing',
                message: `${provider.name} Map 단계: ${Math.min(i + concurrency, textChunks.length)}/${textChunks.length} 청크 완료`,
                provider: provider.name,
                progress: Math.round(chunkProgress),
              })
            }

            // Reduce 단계: 부분 결과 종합
            send('progress', {
              stage: 'reducing',
              message: `${provider.name} Reduce 단계: 결과 종합 중...`,
              provider: provider.name,
              progress: Math.round(baseProgress + providerWeight * 0.8),
            })

            const finalResult = await reduceResults(
              provider,
              partialResults,
              systemPrompt,
              userPrompt,
              schema,
            )

            allResults.push({
              provider: provider.name,
              success: true,
              structuredOutput: finalResult,
            })

            send('progress', {
              stage: 'analyzing',
              message: `${provider.name} 분석 완료`,
              provider: provider.name,
              progress: Math.round(baseProgress + providerWeight),
            })
          } catch (error) {
            allResults.push({
              provider: provider.name,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }

        // 4. 최종 결과 전송
        send('progress', { stage: 'complete', message: '분석 완료', progress: 100 })
        send('result', {
          results: allResults,
          fileName: meta.fileName,
          fileSize: fullBuffer.length,
          chunks: textChunks.length,
        })

        // 5. 임시 파일 정리
        await rm(uploadPath, { recursive: true, force: true }).catch(() => {})
      } catch (error) {
        send('error', {
          message:
            error instanceof Error ? error.message : '분석 중 오류가 발생했습니다',
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
