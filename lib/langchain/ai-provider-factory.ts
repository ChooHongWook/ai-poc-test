// AI 제공자 팩토리 - 환경변수에 따라 LLM 인스턴스 생성
// @MX:ANCHOR: 분석 체인에서 제공자 목록을 얻는 유일한 진입점
// @MX:REASON: analysis-chain, API 라우트 핸들러에서 참조

import { ChatOpenAI } from '@langchain/openai'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import type { ProviderConfig } from './types'

/**
 * 환경변수에 설정된 API 키를 기반으로 사용 가능한 AI 제공자 목록 반환
 * API 키가 없는 제공자는 건너뜀
 */
export function createProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = []

  // OpenAI 제공자
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: 'ChatOpenAI',
      model: new ChatOpenAI({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        apiKey: process.env.OPENAI_API_KEY,
      }),
    })
  }

  // Google Gemini 제공자
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    providers.push({
      name: 'ChatGoogleGenerativeAI',
      model: new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        temperature: 0.3,
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
    })
  }

  // Anthropic Claude 제공자
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      name: 'ChatAnthropic',
      model: new ChatAnthropic({
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        apiKey: process.env.ANTHROPIC_API_KEY,
      }),
    })
  }

  return providers
}
