// TASK-004: route.ts POST 핸들러 단위 테스트
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import type { TestKeyResponse } from '../_validate'

// _adapters 전체 모킹
vi.mock('../_adapters', () => ({
  runQuickCheck: vi.fn(),
  runPingCheck: vi.fn(),
}))

describe('POST /api/test-key', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 스키마 검증 ───────────────────────────────────────────────
  describe('요청 검증', () => {
    it('유효하지 않은 요청 본문이면 422를 반환한다', async () => {
      const { POST } = await import('../route')
      const req = new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'invalid-provider', apiKey: 'key', mode: 'quick', models: [] }),
      })

      const response = await POST(req)
      expect(response.status).toBe(422)
    })

    it('apiKey 가 비어 있으면 422를 반환한다', async () => {
      const { POST } = await import('../route')
      const req = new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'chatgpt', apiKey: '', mode: 'quick', models: [] }),
      })

      const response = await POST(req)
      expect(response.status).toBe(422)
    })

    it('필수 필드가 누락되면 422를 반환한다', async () => {
      const { POST } = await import('../route')
      const req = new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'chatgpt' }),
      })

      const response = await POST(req)
      expect(response.status).toBe(422)
    })
  })

  // ── quick 모드 ────────────────────────────────────────────────
  describe('quick 모드', () => {
    it('quick 모드에서 runQuickCheck를 호출한다', async () => {
      const { runQuickCheck } = await import('../_adapters')
      vi.mocked(runQuickCheck).mockResolvedValueOnce({ keyValid: true })

      const { POST } = await import('../route')
      const req = new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'chatgpt',
          apiKey: 'sk-valid',
          mode: 'quick',
          models: [],
        }),
      })

      const response = await POST(req)
      expect(response.status).toBe(200)
      expect(runQuickCheck).toHaveBeenCalledWith('chatgpt', 'sk-valid')
    })

    it('quick 모드에서 keyValid=true 응답을 반환한다', async () => {
      const { runQuickCheck } = await import('../_adapters')
      const mockResult: TestKeyResponse = { keyValid: true }
      vi.mocked(runQuickCheck).mockResolvedValueOnce(mockResult)

      const { POST } = await import('../route')
      const req = new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'claude',
          apiKey: 'sk-ant-key',
          mode: 'quick',
          models: [],
        }),
      })

      const response = await POST(req)
      const body = await response.json() as TestKeyResponse
      expect(body.keyValid).toBe(true)
      expect(body.results).toBeUndefined()
    })

    it('quick 모드에서 keyValid=false 일 때 에러 메시지를 반환한다', async () => {
      const { runQuickCheck } = await import('../_adapters')
      vi.mocked(runQuickCheck).mockResolvedValueOnce({
        keyValid: false,
        keyError: '인증 실패',
      })

      const { POST } = await import('../route')
      const req = new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          apiKey: 'AIza-bad-key',
          mode: 'quick',
          models: [],
        }),
      })

      const response = await POST(req)
      const body = await response.json() as TestKeyResponse
      expect(body.keyValid).toBe(false)
      expect(body.keyError).toBe('인증 실패')
    })

    it('quick 모드에서 runPingCheck를 호출하지 않는다', async () => {
      const { runQuickCheck, runPingCheck } = await import('../_adapters')
      vi.mocked(runQuickCheck).mockResolvedValueOnce({ keyValid: true })

      const { POST } = await import('../route')
      const req = new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'chatgpt',
          apiKey: 'sk-key',
          mode: 'quick',
          models: ['gpt-4o'],
        }),
      })

      await POST(req)
      expect(runPingCheck).not.toHaveBeenCalled()
    })
  })

  // ── ping 모드 ─────────────────────────────────────────────────
  describe('ping 모드', () => {
    it('ping 모드에서 quick 확인 후 ping 을 실행한다', async () => {
      const { runQuickCheck, runPingCheck } = await import('../_adapters')
      vi.mocked(runQuickCheck).mockResolvedValueOnce({ keyValid: true })
      vi.mocked(runPingCheck).mockResolvedValueOnce([
        { model: 'gpt-4o', success: true, latencyMs: 100, preview: 'Hi' },
      ])

      const { POST } = await import('../route')
      const req = new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'chatgpt',
          apiKey: 'sk-key',
          mode: 'ping',
          models: ['gpt-4o'],
        }),
      })

      const response = await POST(req)
      expect(response.status).toBe(200)
      expect(runQuickCheck).toHaveBeenCalledOnce()
      expect(runPingCheck).toHaveBeenCalledOnce()
    })

    it('ping 모드에서 keyValid=false 이면 ping 을 실행하지 않는다', async () => {
      const { runQuickCheck, runPingCheck } = await import('../_adapters')
      vi.mocked(runQuickCheck).mockResolvedValueOnce({
        keyValid: false,
        keyError: '인증 실패',
      })

      const { POST } = await import('../route')
      const req = new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'chatgpt',
          apiKey: 'sk-bad',
          mode: 'ping',
          models: ['gpt-4o'],
        }),
      })

      const response = await POST(req)
      const body = await response.json() as TestKeyResponse
      expect(body.keyValid).toBe(false)
      expect(runPingCheck).not.toHaveBeenCalled()
    })

    it('ping 모드에서 results 배열을 응답에 포함한다', async () => {
      const { runQuickCheck, runPingCheck } = await import('../_adapters')
      vi.mocked(runQuickCheck).mockResolvedValueOnce({ keyValid: true })
      const mockResults = [
        { model: 'gpt-4o', success: true, latencyMs: 120, preview: 'Hello' },
        { model: 'gpt-4o-mini', success: false, latencyMs: 0, error: 'Not found' },
      ]
      vi.mocked(runPingCheck).mockResolvedValueOnce(mockResults)

      const { POST } = await import('../route')
      const req = new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'chatgpt',
          apiKey: 'sk-key',
          mode: 'ping',
          models: ['gpt-4o', 'gpt-4o-mini'],
        }),
      })

      const response = await POST(req)
      const body = await response.json() as TestKeyResponse
      expect(body.keyValid).toBe(true)
      expect(body.results).toHaveLength(2)
      expect(body.results![0]!.model).toBe('gpt-4o')
    })
  })
})
