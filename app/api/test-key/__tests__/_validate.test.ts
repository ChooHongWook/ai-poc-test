// TASK-001: _validate.ts 에 대한 Zod 스키마 검증 테스트 (RED 페이즈)
import { describe, expect, it } from 'vitest'
import { TestKeyRequestSchema, type TestKeyRequest } from '../_validate'

describe('TestKeyRequestSchema', () => {
  // 유효한 요청 데이터 기준값
  const validQuickRequest: TestKeyRequest = {
    provider: 'chatgpt',
    apiKey: 'sk-test-key-123',
    mode: 'quick',
    models: [],
  }

  const validPingRequest: TestKeyRequest = {
    provider: 'gemini',
    apiKey: 'AIza-test-key',
    mode: 'ping',
    models: ['gemini-2.0-flash', 'gemini-2.5-pro'],
  }

  // ── 유효한 요청 파싱 ──────────────────────────────────────────
  it('유효한 quick 모드 요청을 파싱한다', () => {
    const result = TestKeyRequestSchema.safeParse(validQuickRequest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.provider).toBe('chatgpt')
      expect(result.data.mode).toBe('quick')
    }
  })

  it('유효한 ping 모드 요청(모델 목록 포함)을 파싱한다', () => {
    const result = TestKeyRequestSchema.safeParse(validPingRequest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.provider).toBe('gemini')
      expect(result.data.mode).toBe('ping')
      expect(result.data.models).toHaveLength(2)
    }
  })

  it('claude 제공자를 허용한다', () => {
    const req = { ...validQuickRequest, provider: 'claude' }
    expect(TestKeyRequestSchema.safeParse(req).success).toBe(true)
  })

  // ── 제공자 검증 ───────────────────────────────────────────────
  it('알 수 없는 제공자는 거부한다', () => {
    const req = { ...validQuickRequest, provider: 'openai' }
    const result = TestKeyRequestSchema.safeParse(req)
    expect(result.success).toBe(false)
  })

  it('빈 제공자 문자열은 거부한다', () => {
    const req = { ...validQuickRequest, provider: '' }
    expect(TestKeyRequestSchema.safeParse(req).success).toBe(false)
  })

  // ── apiKey 검증 ───────────────────────────────────────────────
  it('빈 apiKey는 거부한다', () => {
    const req = { ...validQuickRequest, apiKey: '' }
    expect(TestKeyRequestSchema.safeParse(req).success).toBe(false)
  })

  it('apiKey가 없으면 거부한다', () => {
    const { apiKey: _, ...req } = validQuickRequest
    expect(TestKeyRequestSchema.safeParse(req).success).toBe(false)
  })

  // ── mode 검증 ─────────────────────────────────────────────────
  it('quick 과 ping 이외의 모드는 거부한다', () => {
    const req = { ...validQuickRequest, mode: 'full' }
    expect(TestKeyRequestSchema.safeParse(req).success).toBe(false)
  })

  // ── models 검증 ───────────────────────────────────────────────
  it('models 배열이 없으면 거부한다', () => {
    const { models: _, ...req } = validPingRequest
    expect(TestKeyRequestSchema.safeParse(req).success).toBe(false)
  })

  it('models가 배열이 아닌 경우 거부한다', () => {
    const req = { ...validQuickRequest, models: 'gpt-4o' }
    expect(TestKeyRequestSchema.safeParse(req).success).toBe(false)
  })

  // ── 타입 추론 확인 ────────────────────────────────────────────
  it('파싱된 결과의 타입이 올바르다', () => {
    const result = TestKeyRequestSchema.parse(validPingRequest)
    // 타입 체크: provider는 유니온 리터럴이어야 함
    const provider: 'chatgpt' | 'gemini' | 'claude' = result.provider
    const mode: 'quick' | 'ping' = result.mode
    expect(provider).toBe('gemini')
    expect(mode).toBe('ping')
  })
})
