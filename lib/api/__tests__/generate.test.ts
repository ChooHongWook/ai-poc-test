/**
 * lib/api/generate.ts 단위 테스트
 * RED 단계: generateOutput 함수가 아직 없으므로 이 테스트는 실패해야 함
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../../mock/handlers'
import { generateOutput } from '../generate'
import type { GenerateResult } from '../../mock/generate'

// MSW 노드 서버를 통해 실제 HTTP 요청처럼 테스트
const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('generateOutput API 클라이언트 함수', () => {
  it('POST /api/generate 요청을 보내고 GenerateResult를 반환해야 함', async () => {
    // Arrange
    const params = {
      chatgpt: { name: 'ChatGPT', enabled: true, model: 'gpt-4o', apiKey: 'test-key' },
      gemini: { name: 'Gemini', enabled: false, model: '', apiKey: '' },
      claude: { name: 'Claude', enabled: false, model: '', apiKey: '' },
      systemPrompt: '테스트 시스템 프롬프트',
      userPrompt: '테스트 사용자 프롬프트',
      schema: '{}',
      inputFields: [],
    }

    // Act: generateOutput 함수 호출
    const result: GenerateResult = await generateOutput(params)

    // Assert: GenerateResult 구조 검증
    expect(result).toHaveProperty('historyItem')
    expect(result.historyItem.systemPrompt).toBe('테스트 시스템 프롬프트')
    expect(result.historyItem.userPrompt).toBe('테스트 사용자 프롬프트')
    expect(result.chatgptOutput).toBeDefined()
    expect(result.chatgptOutput?.generated).toBe(true)
  })

  it('API 오류 시 Error를 throw해야 함', async () => {
    // Arrange: 서버 오류 핸들러로 덮어씀
    const { http, HttpResponse } = await import('msw')
    server.use(
      http.post('*/api/generate', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    const params = {
      chatgpt: { name: 'ChatGPT', enabled: true, model: 'gpt-4o', apiKey: 'test-key' },
      gemini: { name: 'Gemini', enabled: false, model: '', apiKey: '' },
      claude: { name: 'Claude', enabled: false, model: '', apiKey: '' },
      systemPrompt: '프롬프트',
      userPrompt: '프롬프트',
      schema: '',
      inputFields: [],
    }

    // Act & Assert: 오류가 throw되어야 함
    await expect(generateOutput(params)).rejects.toThrow('API error: 500')
  })

  it('반환 타입이 GenerateResult와 일치해야 함', async () => {
    // Arrange
    const params = {
      chatgpt: { name: 'ChatGPT', enabled: true, model: 'gpt-4o', apiKey: 'test-key' },
      gemini: { name: 'Gemini', enabled: true, model: 'gemini-pro', apiKey: 'test-key' },
      claude: { name: 'Claude', enabled: false, model: '', apiKey: '' },
      systemPrompt: '시스템',
      userPrompt: '사용자',
      schema: '',
      inputFields: [{ id: '1', label: '테스트', value: '값' }],
    }

    // Act
    const result = await generateOutput(params)

    // Assert: 타입 구조 검증
    expect(typeof result.historyItem.id).toBe('string')
    expect(result.historyItem.inputFields).toBeInstanceOf(Array)
    expect(result.chatgptOutput?.data).toBeTypeOf('object')
    expect(result.geminiOutput?.data).toBeTypeOf('object')
    expect(result.claudeOutput).toBeUndefined()
  })
})
