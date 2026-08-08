// TASK-004: route.ts POST 핸들러 단위 테스트
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import type { TestKeyResponse } from '../_validate'

// _adapters 전체 모킹
// redactApiKey는 _batch-adapters가 import하므로 모킹 객체에도 포함해야 한다
vi.mock('../_adapters', () => ({
  runQuickCheck: vi.fn(),
  runPingCheck: vi.fn(),
  redactApiKey: vi.fn((message: string) => message),
}))

// _batch-adapters 모킹 (batch 모드 분기 검증용)
vi.mock('../_batch-adapters', () => ({
  submitBatchJobs: vi.fn(),
  pollBatchJobs: vi.fn(),
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

  // ── batch 모드 ────────────────────────────────────────────────
  describe('batch 모드', () => {
    function batchRequest(models: string[]) {
      return new Request('http://localhost/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'chatgpt',
          apiKey: 'sk-key',
          mode: 'batch',
          models,
        }),
      })
    }

    it('models 가 비어 있으면 422를 반환한다', async () => {
      const { POST } = await import('../route')
      const response = await POST(batchRequest([]))
      expect(response.status).toBe(422)
    })

    it('키가 무효하면 배치를 제출하지 않는다', async () => {
      const { runQuickCheck } = await import('../_adapters')
      const { submitBatchJobs } = await import('../_batch-adapters')
      vi.mocked(runQuickCheck).mockResolvedValueOnce({
        keyValid: false,
        keyError: '인증 실패',
      })

      const { POST } = await import('../route')
      const response = await POST(batchRequest(['gpt-5.4-mini']))
      const body = (await response.json()) as TestKeyResponse

      expect(body.keyValid).toBe(false)
      expect(submitBatchJobs).not.toHaveBeenCalled()
    })

    it('키가 유효하면 batchJobs 를 응답에 포함한다', async () => {
      const { runQuickCheck } = await import('../_adapters')
      const { submitBatchJobs, pollBatchJobs } = await import('../_batch-adapters')
      vi.mocked(runQuickCheck).mockResolvedValueOnce({ keyValid: true })
      vi.mocked(submitBatchJobs).mockResolvedValueOnce([
        { model: 'gpt-5.4-mini', jobId: 'batch_abc', status: 'pending' },
      ])

      const { POST } = await import('../route')
      const response = await POST(batchRequest(['gpt-5.4-mini']))
      const body = (await response.json()) as TestKeyResponse

      expect(body.keyValid).toBe(true)
      expect(body.batchJobs).toHaveLength(1)
      expect(body.batchJobs![0]!.jobId).toBe('batch_abc')
      // batch 모드는 ping 을 수행하지 않고 폴링도 시작하지 않는다
      expect(body.results).toBeUndefined()
      expect(pollBatchJobs).not.toHaveBeenCalled()
    })
  })
})

// ── batch-status 라우트 ─────────────────────────────────────────
describe('POST /api/test-key/batch-status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function statusRequest(body: unknown) {
    return new Request('http://localhost/api/test-key/batch-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('jobs 가 비어 있으면 422를 반환한다', async () => {
    const { POST } = await import('../batch-status/route')
    const response = await POST(
      statusRequest({ provider: 'chatgpt', apiKey: 'sk-key', jobs: [] }),
    )
    expect(response.status).toBe(422)
  })

  it('jobId 가 없는 잡이 포함되면 422를 반환한다', async () => {
    const { POST } = await import('../batch-status/route')
    const response = await POST(
      statusRequest({
        provider: 'chatgpt',
        apiKey: 'sk-key',
        jobs: [{ model: 'gpt-5.4-mini', jobId: '' }],
      }),
    )
    expect(response.status).toBe(422)
  })

  it('유효한 요청이면 폴링 결과를 반환한다', async () => {
    const { pollBatchJobs } = await import('../_batch-adapters')
    vi.mocked(pollBatchJobs).mockResolvedValueOnce([
      { model: 'gpt-5.4-mini', jobId: 'batch_abc', status: 'succeeded', preview: 'Hi' },
    ])

    const { POST } = await import('../batch-status/route')
    const response = await POST(
      statusRequest({
        provider: 'chatgpt',
        apiKey: 'sk-key',
        jobs: [{ model: 'gpt-5.4-mini', jobId: 'batch_abc' }],
      }),
    )
    const body = (await response.json()) as { jobs: { status: string; preview?: string }[] }

    expect(response.status).toBe(200)
    expect(body.jobs[0]!.status).toBe('succeeded')
    expect(body.jobs[0]!.preview).toBe('Hi')
  })
})
