/**
 * MSW 핸들러 단위 테스트
 * RED 단계: 핸들러가 아직 없으므로 이 테스트는 실패해야 함
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../handlers'
import type { GenerateResult } from '../generate'

// 테스트 환경의 기준 URL (MSW node 서버는 절대 URL 필요)
const BASE_URL = 'http://localhost:3000'

// MSW 노드 서버 설정
const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('POST /api/generate MSW 핸들러', () => {
  it('모든 AI가 활성화된 경우 3개의 출력을 반환해야 함', async () => {
    // Arrange: 테스트 요청 파라미터
    const params = {
      chatgpt: { name: 'ChatGPT', enabled: true, model: 'gpt-4o', apiKey: 'test-key' },
      gemini: { name: 'Gemini', enabled: true, model: 'gemini-pro', apiKey: 'test-key' },
      claude: { name: 'Claude', enabled: true, model: 'claude-3-5-sonnet', apiKey: 'test-key' },
      systemPrompt: '테스트 시스템 프롬프트',
      userPrompt: '테스트 사용자 프롬프트',
      schema: '{}',
      inputFields: [{ id: '1', label: '이름', value: '홍길동' }],
    }

    // Act: POST /api/generate 호출
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    // Assert: 응답 구조 검증
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)

    const result: GenerateResult = await response.json()

    // GenerateResult 구조 검증
    expect(result).toHaveProperty('historyItem')
    expect(result.historyItem).toHaveProperty('id')
    expect(result.historyItem).toHaveProperty('timestamp')
    expect(result.historyItem.systemPrompt).toBe('테스트 시스템 프롬프트')
    expect(result.historyItem.userPrompt).toBe('테스트 사용자 프롬프트')

    // 활성화된 모든 AI의 출력 검증
    expect(result.chatgptOutput).toBeDefined()
    expect(result.chatgptOutput?.generated).toBe(true)
    expect(result.chatgptOutput?.data).toBeTypeOf('object')

    expect(result.geminiOutput).toBeDefined()
    expect(result.geminiOutput?.generated).toBe(true)

    expect(result.claudeOutput).toBeDefined()
    expect(result.claudeOutput?.generated).toBe(true)
  })

  it('ChatGPT만 활성화된 경우 chatgptOutput만 반환해야 함', async () => {
    // Arrange
    const params = {
      chatgpt: { name: 'ChatGPT', enabled: true, model: 'gpt-4o', apiKey: 'test-key' },
      gemini: { name: 'Gemini', enabled: false, model: '', apiKey: '' },
      claude: { name: 'Claude', enabled: false, model: '', apiKey: '' },
      systemPrompt: '시스템 프롬프트',
      userPrompt: '사용자 프롬프트',
      schema: '',
      inputFields: [],
    }

    // Act
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    // Assert
    expect(response.ok).toBe(true)
    const result: GenerateResult = await response.json()

    expect(result.chatgptOutput).toBeDefined()
    expect(result.chatgptOutput?.generated).toBe(true)
    expect(result.geminiOutput).toBeUndefined()
    expect(result.claudeOutput).toBeUndefined()
  })

  it('inputFields의 값이 응답 데이터에 포함되어야 함', async () => {
    // Arrange
    const params = {
      chatgpt: { name: 'ChatGPT', enabled: true, model: 'gpt-4o', apiKey: 'test-key' },
      gemini: { name: 'Gemini', enabled: false, model: '', apiKey: '' },
      claude: { name: 'Claude', enabled: false, model: '', apiKey: '' },
      systemPrompt: '프롬프트',
      userPrompt: '프롬프트',
      schema: '',
      inputFields: [{ id: '1', label: '프로젝트명', value: 'MSW 마이그레이션' }],
    }

    // Act
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    // Assert
    const result: GenerateResult = await response.json()
    expect(result.chatgptOutput?.data['프로젝트명']).toBe('MSW 마이그레이션')
  })
})
