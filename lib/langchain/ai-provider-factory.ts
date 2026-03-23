// AI 제공자 팩토리 - config 기반 LLM 인스턴스 생성
// @MX:ANCHOR: 분석 체인에서 제공자 목록을 얻는 유일한 진입점
// @MX:REASON: analysis-chain, API 라우트 핸들러에서 참조

import { ChatOpenAI } from '@langchain/openai'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import type { ProviderConfig } from './types'
import type { AiProviderConfigs } from '@/lib/types'
import {
  OPENAI_DEFAULT_MODEL,
  GEMINI_DEFAULT_MODEL,
  CLAUDE_DEFAULT_MODEL,
} from '@/lib/constants/ai-models'

/**
 * config에서 전달된 AI 설정을 기반으로 사용 가능한 AI 제공자 목록 반환
 * enabled가 false이거나 apiKey가 없는 제공자는 건너뜀
 */
export function createProviders(config: AiProviderConfigs): ProviderConfig[] {
  const providers: ProviderConfig[] = []

  // OpenAI 제공자
  if (config.chatgpt.enabled && config.chatgpt.apiKey) {
    providers.push({
      name: 'ChatOpenAI',
      model: new ChatOpenAI({
        model: config.chatgpt.model || OPENAI_DEFAULT_MODEL,
        temperature: 0.3,
        apiKey: config.chatgpt.apiKey,
      }),
    })
  }

  // Google Gemini 제공자
  if (config.gemini.enabled && config.gemini.apiKey) {
    providers.push({
      name: 'ChatGoogleGenerativeAI',
      model: new ChatGoogleGenerativeAI({
        model: config.gemini.model || GEMINI_DEFAULT_MODEL,
        temperature: 0.3,
        apiKey: config.gemini.apiKey,
      }),
    })
  }

  // Anthropic Claude 제공자
  if (config.claude.enabled && config.claude.apiKey) {
    providers.push({
      name: 'ChatAnthropic',
      model: new ChatAnthropic({
        model: config.claude.model || CLAUDE_DEFAULT_MODEL,
        temperature: 0.3,
        apiKey: config.claude.apiKey,
      }),
    })
  }

  return providers
}
