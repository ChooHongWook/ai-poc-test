// RAG 체인 - 검색 기반 증강 생성 (Retrieval-Augmented Generation)
// @MX:ANCHOR: RAG 질의응답의 핵심 체인 구성 함수
// @MX:REASON: API 라우트(query)에서 직접 호출하는 RAG 진입점

import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { SearchResult } from './vector-store'

// RAG 응답 타입
export interface RagResponse {
  answer: string
  sources: SearchResult[]
  provider: string
}

// RAG 시스템 프롬프트 템플릿
const RAG_SYSTEM_PROMPT = `당신은 문서 기반 질의응답 전문가입니다.
주어진 문서 컨텍스트만을 기반으로 사용자의 질문에 정확하게 답변하세요.

규칙:
- 컨텍스트에 없는 정보는 답변하지 마세요
- 답변할 수 없는 경우 "제공된 문서에서 해당 정보를 찾을 수 없습니다"라고 답하세요
- 답변 시 근거가 되는 문서 내용을 인용하세요
- 한국어로 답변하세요

컨텍스트:
{context}`

/**
 * 검색된 청크들을 컨텍스트 문자열로 포맷팅
 */
function formatContext(sources: SearchResult[]): string {
  return sources
    .map(
      (s, i) =>
        `[문서 ${i + 1}] (유사도: ${(s.score * 100).toFixed(1)}%)\n${s.content}`,
    )
    .join('\n\n---\n\n')
}

/**
 * RAG 체인 실행 - 검색된 컨텍스트를 LLM에 전달하여 답변 생성
 * StringOutputParser 사용으로 스트리밍 가능
 */
export async function executeRagChain(params: {
  query: string
  sources: SearchResult[]
  llm: BaseChatModel
  providerName: string
}): Promise<RagResponse> {
  const { query, sources, llm, providerName } = params

  const context = formatContext(sources)

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', RAG_SYSTEM_PROMPT],
    ['human', '{question}'],
  ])

  const chain = prompt.pipe(llm).pipe(new StringOutputParser())

  const answer = await chain.invoke({
    context,
    question: query,
  })

  return {
    answer,
    sources,
    provider: providerName,
  }
}

/**
 * RAG 체인 스트리밍 실행 - SSE용 AsyncGenerator 반환
 * 토큰 단위로 응답을 스트리밍
 */
export async function* streamRagChain(params: {
  query: string
  sources: SearchResult[]
  llm: BaseChatModel
  providerName: string
}): AsyncGenerator<string> {
  const { query, sources, llm } = params

  const context = formatContext(sources)

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', RAG_SYSTEM_PROMPT],
    ['human', '{question}'],
  ])

  const chain = prompt.pipe(llm).pipe(new StringOutputParser())

  const stream = await chain.stream({
    context,
    question: query,
  })

  for await (const chunk of stream) {
    yield chunk
  }
}
