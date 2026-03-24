// LangChain.js 분석 체인 - 문서를 AI 제공자로 분석
// @MX:ANCHOR: 모든 AI 분석 요청의 핵심 처리 함수
// @MX:REASON: API 라우트 핸들러에서 직접 호출하는 서비스 레이어 진입점

import type { Document } from '@langchain/core/documents'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import type {
  AnalysisRequest,
  AnalysisResponse,
  ProviderConfig,
  ProviderResult,
} from './types'

// 토큰 절단 임계값 (약 12,000자 = 약 4,000 토큰)
const MAX_CONTENT_LENGTH = 12_000

/**
 * Document 배열의 pageContent를 절단 처리
 * 총 길이가 임계값을 초과하면 절단 후 새 Document 배열 반환
 */
function truncateDocuments(documents: Document[]): {
  documents: Document[]
  truncated: boolean
} {
  let totalLength = 0
  const truncated: Document[] = []

  for (const doc of documents) {
    const remaining = MAX_CONTENT_LENGTH - totalLength
    if (remaining <= 0) break

    if (doc.pageContent.length <= remaining) {
      truncated.push(doc)
      totalLength += doc.pageContent.length
    } else {
      truncated.push({
        ...doc,
        pageContent: doc.pageContent.slice(0, remaining),
      })
      return { documents: truncated, truncated: true }
    }
  }

  return {
    documents: truncated,
    truncated: totalLength > MAX_CONTENT_LENGTH,
  }
}

/**
 * Document 배열을 하나의 텍스트로 결합
 */
function formatDocuments(documents: Document[]): string {
  return documents.map((doc) => doc.pageContent).join('\n\n')
}

/**
 * 단일 AI 제공자로 문서 분석 수행
 * LCEL pipe 체인으로 prompt → model → parser 구성
 */
async function analyzeWithProvider(
  provider: ProviderConfig,
  documents: Document[],
  systemPrompt: string,
  userPrompt: string,
  schema?: AnalysisRequest['schema'],
): Promise<ProviderResult> {
  const context = formatDocuments(documents)
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `{systemPrompt}\n\n{context}`],
    ['human', '{input}'],
  ])

  try {
    if (schema) {
      // 구조화 출력: prompt → structuredModel (function calling)
      const chain = prompt.pipe(provider.model.withStructuredOutput(schema))
      const result = await chain.invoke({
        systemPrompt,
        input: userPrompt,
        context,
      })

      return {
        provider: provider.name,
        success: true,
        structuredOutput: result as Record<string, unknown>,
      }
    } else {
      // 일반 텍스트 출력: prompt → model → StringOutputParser
      const chain = prompt.pipe(provider.model).pipe(new StringOutputParser())
      const result = await chain.invoke({
        systemPrompt,
        input: userPrompt,
        context,
      })

      return {
        provider: provider.name,
        success: true,
        content: result,
      }
    }
  } catch (error) {
    return {
      provider: provider.name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 복수의 AI 제공자로 문서를 동시에 분석
 * Promise.allSettled를 사용하여 부분 실패를 허용
 */
export async function analyzeDocuments(
  request: AnalysisRequest,
): Promise<AnalysisResponse> {
  const {
    documents,
    providers,
    systemPrompt = '당신은 문서 분석 전문가입니다. 주어진 문서를 분석하여 핵심 내용을 추출하세요.',
    userPrompt = '다음 문서를 분석해주세요.',
    schema,
  } = request

  // 빈 제공자 목록 처리
  if (providers.length === 0) {
    return { results: [] }
  }

  // 문서 절단 처리
  const { documents: truncatedDocs, truncated } = truncateDocuments(documents)

  // 모든 제공자에 대해 동시 분석 실행
  const settledResults = await Promise.allSettled(
    providers.map((provider) =>
      analyzeWithProvider(
        provider,
        truncatedDocs,
        systemPrompt,
        userPrompt,
        schema,
      ),
    ),
  )

  // Promise.allSettled 결과를 ProviderResult 배열로 변환
  const results: ProviderResult[] = settledResults.map((settled, index) => {
    if (settled.status === 'fulfilled') {
      return settled.value
    } else {
      return {
        provider: providers[index]!.name,
        success: false,
        error:
          settled.reason instanceof Error
            ? settled.reason.message
            : String(settled.reason),
      }
    }
  })

  return {
    results,
    ...(truncated && { truncated: true }),
  }
}
