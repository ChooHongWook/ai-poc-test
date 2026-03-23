// LangChain.js 분석 체인 - 문서를 AI 제공자로 분석
// @MX:ANCHOR: 모든 AI 분석 요청의 핵심 처리 함수
// @MX:REASON: API 라우트 핸들러에서 직접 호출하는 서비스 레이어 진입점

import type { Document } from '@langchain/core/documents'
import type {
  AnalysisRequest,
  AnalysisResponse,
  ProviderConfig,
  ProviderResult,
} from './types'

// 토큰 절단 임계값 (약 12,000자 = 약 4,000 토큰)
const MAX_CONTENT_LENGTH = 12_000

/**
 * Document 배열을 하나의 텍스트로 합치고 필요시 절단
 * 절단 여부를 함께 반환
 */
function combineDocuments(documents: Document[]): {
  text: string
  truncated: boolean
} {
  const fullText = documents.map((doc) => doc.pageContent).join('\n\n')

  if (fullText.length > MAX_CONTENT_LENGTH) {
    return {
      text: fullText.slice(0, MAX_CONTENT_LENGTH),
      truncated: true,
    }
  }

  return { text: fullText, truncated: false }
}

/**
 * 단일 AI 제공자로 문서 분석 수행
 * schema가 있으면 구조화 출력, 없으면 텍스트 출력
 */
async function analyzeWithProvider(
  provider: ProviderConfig,
  documentText: string,
  _systemPrompt: string,
  _userPrompt: string,
  schema?: AnalysisRequest['schema'],
): Promise<ProviderResult> {
  try {
    if (schema) {
      // Zod 스키마 제공 시 구조화 출력 사용 - 모델에 직접 invoke
      const structuredModel = provider.model.withStructuredOutput(schema)
      const result = await structuredModel.invoke(documentText)

      return {
        provider: provider.name,
        success: true,
        structuredOutput: result as Record<string, unknown>,
      }
    } else {
      // 일반 텍스트 출력 - 모델 직접 invoke
      const rawResult = await provider.model.invoke(documentText)

      // 응답에서 텍스트 추출 (AIMessage 또는 string 형태)
      const content =
        typeof rawResult === 'string'
          ? rawResult
          : typeof rawResult === 'object' &&
              rawResult !== null &&
              'content' in rawResult
            ? String((rawResult as { content: unknown }).content)
            : String(rawResult)

      return {
        provider: provider.name,
        success: true,
        content,
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
    userPrompt = '다음 문서를 분석해주세요:\n\n{document}',
    schema,
  } = request

  // 빈 제공자 목록 처리
  if (providers.length === 0) {
    return { results: [] }
  }

  // 문서 텍스트 합치기 및 절단 처리
  const { text: documentText, truncated } = combineDocuments(documents)

  // 모든 제공자에 대해 동시 분석 실행
  const settledResults = await Promise.allSettled(
    providers.map((provider) =>
      analyzeWithProvider(
        provider,
        documentText,
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
