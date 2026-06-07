// API Key 검증 어댑터 - 빠른 인증 확인 및 모델 Ping 테스트
// @MX:ANCHOR: test-key API의 실제 외부 호출 처리 진입점
// @MX:REASON: route.ts에서 직접 호출하는 서비스 레이어. 두 함수 모두 외부에서 참조됨

import { ChatOpenAI } from '@langchain/openai'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import type { TestKeyResponse, ModelTestResult, Provider } from './_validate'

// 외부 API 호출 타임아웃 (15초)
const TIMEOUT_MS = 15_000

// 동시 모델 Ping 최대 개수
const MAX_CONCURRENCY = 3

// 미리보기 최대 길이 (문자 단위)
const MAX_PREVIEW_LENGTH = 200

/**
 * 에러 메시지에서 apiKey 원문을 [REDACTED]로 치환
 * - 정규식 전역 치환으로 메시지 내 모든 출현 위치를 마스킹
 * - 특수문자 이스케이프로 정규식 주입 방지
 */
function redactApiKey(message: string, apiKey: string): string {
  const escaped = apiKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return message.replace(new RegExp(escaped, 'g'), '[REDACTED]')
}

// 제공자별 인증 엔드포인트 정의
const QUICK_CHECK_ENDPOINTS: Record<
  Provider,
  (apiKey: string) => { url: string; init: RequestInit }
> = {
  chatgpt: (apiKey) => ({
    url: 'https://api.openai.com/v1/models',
    init: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  }),
  gemini: (apiKey) => ({
    url: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    init: {},
  }),
  claude: (apiKey) => ({
    url: 'https://api.anthropic.com/v1/models',
    init: {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    },
  }),
}

/**
 * 제공자 인증 엔드포인트에 HTTP GET 요청으로 API Key 유효성을 빠르게 검증
 * - 2xx: keyValid=true
 * - 401/403: keyValid=false + keyError
 * - 429: rate limit 메시지
 * - AbortError: timeout 메시지
 * apiKey 원문은 에러 메시지에 절대 포함하지 않음
 */
export async function runQuickCheck(
  provider: Provider,
  apiKey: string,
): Promise<TestKeyResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const { url, init } = QUICK_CHECK_ENDPOINTS[provider](apiKey)
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })

    if (response.ok) {
      return { keyValid: true }
    }

    if (response.status === 429) {
      return {
        keyValid: false,
        keyError: 'Rate limit exceeded. 잠시 후 다시 시도하세요.',
      }
    }

    if (response.status === 401 || response.status === 403) {
      return {
        keyValid: false,
        keyError: '인증 실패: API Key가 유효하지 않습니다.',
      }
    }

    return {
      keyValid: false,
      keyError: `HTTP 오류: ${response.status}`,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        keyValid: false,
        keyError: 'timeout: 응답 시간이 초과되었습니다.',
      }
    }
    // apiKey 원문이 에러 메시지에 노출되지 않도록 일반 메시지로 처리
    return {
      keyValid: false,
      keyError: '네트워크 오류가 발생했습니다.',
    }
  } finally {
    clearTimeout(timer)
  }
}

// 제공자별 LangChain 채팅 인스턴스 팩토리 (ai-provider-factory 패턴 참조)
// QUICK_CHECK_ENDPOINTS와 동일하게 데이터 주도 방식으로 분기 일원화
const CHAT_FACTORIES: Record<
  Provider,
  (apiKey: string, model: string) => { invoke: (input: string) => Promise<{ content: unknown }> }
> = {
  chatgpt: (apiKey, model) => new ChatOpenAI({ model, apiKey, temperature: 0 }),
  gemini: (apiKey, model) =>
    new ChatGoogleGenerativeAI({ model, apiKey, temperature: 0 }),
  claude: (apiKey, model) => new ChatAnthropic({ model, apiKey, temperature: 0 }),
}

/**
 * 단일 모델에 대해 LangChain 채팅 인스턴스를 생성하고 invoke 결과를 반환
 * 에러 시 apiKey 원문이 메시지에 포함되지 않도록 처리
 */
async function pingModel(
  provider: Provider,
  apiKey: string,
  model: string,
): Promise<ModelTestResult> {
  const start = Date.now()
  try {
    // 제공자별 LangChain 인스턴스 생성 후 invoke
    const chat = CHAT_FACTORIES[provider](apiKey, model)
    const response = await chat.invoke('Hi')

    const latencyMs = Date.now() - start

    // 응답 콘텐츠 추출 및 미리보기 절단
    const rawContent =
      typeof response.content === 'string'
        ? response.content
        : String(response.content)
    const preview = rawContent.slice(0, MAX_PREVIEW_LENGTH)

    return {
      model,
      success: true,
      latencyMs,
      preview,
    }
  } catch (error) {
    const latencyMs = Date.now() - start
    let errorMessage = '모델 호출 중 오류가 발생했습니다.'

    if (error instanceof Error) {
      // apiKey 원문이 에러 메시지에 포함되지 않도록 치환
      errorMessage = redactApiKey(error.message, apiKey)
    }

    return {
      model,
      success: false,
      latencyMs,
      error: errorMessage,
    }
  }
}

/**
 * 여러 모델을 MAX_CONCURRENCY=3 단위로 청크 분할하여 동시 Ping 실행
 * Promise.allSettled로 부분 실패를 허용하며 모든 결과를 수집
 * apiKey 원문은 에러 메시지에 절대 포함하지 않음
 */
export async function runPingCheck(
  provider: Provider,
  apiKey: string,
  models: string[],
): Promise<ModelTestResult[]> {
  const results: ModelTestResult[] = []

  // MAX_CONCURRENCY 단위로 청크 분할하여 순차 실행
  for (let i = 0; i < models.length; i += MAX_CONCURRENCY) {
    const chunk = models.slice(i, i + MAX_CONCURRENCY)
    const settled = await Promise.allSettled(
      chunk.map((model) => pingModel(provider, apiKey, model)),
    )

    for (let j = 0; j < settled.length; j++) {
      const outcome = settled[j]!
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value)
      } else {
        // pingModel 자체가 에러를 catch하므로 여기까지 올 가능성이 낮지만 방어 처리
        results.push({
          model: chunk[j] ?? 'unknown',
          success: false,
          latencyMs: 0,
          error: '예기치 않은 오류가 발생했습니다.',
        })
      }
    }
  }

  return results
}
