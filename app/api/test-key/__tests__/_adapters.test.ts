// TASK-002 + TASK-003: _adapters.ts 에 대한 단위 테스트 (RED 페이즈)
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { runQuickCheck, runPingCheck } from '../_adapters'

// ── Quick 어댑터 테스트 ────────────────────────────────────────────

describe('runQuickCheck', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  // chatgpt 제공자
  describe('chatgpt 제공자', () => {
    it('2xx 응답이면 keyValid=true 를 반환한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }))
      const result = await runQuickCheck('chatgpt', 'sk-valid-key')
      expect(result.keyValid).toBe(true)
      expect(result.keyError).toBeUndefined()
    })

    it('401 응답이면 keyValid=false 를 반환한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      )
      const result = await runQuickCheck('chatgpt', 'sk-invalid-key')
      expect(result.keyValid).toBe(false)
      expect(result.keyError).toBeDefined()
    })

    it('403 응답이면 keyValid=false 를 반환한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('Forbidden', { status: 403 }),
      )
      const result = await runQuickCheck('chatgpt', 'sk-bad-key')
      expect(result.keyValid).toBe(false)
    })

    it('429 응답이면 rate limit 메시지를 포함한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('Too Many Requests', { status: 429 }),
      )
      const result = await runQuickCheck('chatgpt', 'sk-rate-limited')
      expect(result.keyValid).toBe(false)
      expect(result.keyError).toMatch(/rate.?limit/i)
    })

    it('AbortError 가 발생하면 timeout 메시지를 반환한다', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }),
      )
      const result = await runQuickCheck('chatgpt', 'sk-key')
      expect(result.keyValid).toBe(false)
      expect(result.keyError).toMatch(/timeout/i)
    })

    it('apiKey 원문이 에러 결과에 포함되지 않는다', async () => {
      const secretKey = 'sk-super-secret-key-12345'
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      )
      const result = await runQuickCheck('chatgpt', secretKey)
      expect(result.keyError).not.toContain(secretKey)
    })

    it('올바른 OpenAI 엔드포인트를 호출한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }))
      await runQuickCheck('chatgpt', 'sk-key')
      const [[url]] = (fetch as ReturnType<typeof vi.fn>).mock.calls
      expect(url).toContain('api.openai.com')
    })
  })

  // gemini 제공자
  describe('gemini 제공자', () => {
    it('2xx 응답이면 keyValid=true 를 반환한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }))
      const result = await runQuickCheck('gemini', 'AIza-valid-key')
      expect(result.keyValid).toBe(true)
    })

    it('401 응답이면 keyValid=false 를 반환한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      )
      const result = await runQuickCheck('gemini', 'AIza-invalid-key')
      expect(result.keyValid).toBe(false)
    })

    it('Gemini ListModels 엔드포인트를 호출한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }))
      await runQuickCheck('gemini', 'AIza-key')
      const [[url]] = (fetch as ReturnType<typeof vi.fn>).mock.calls
      expect(url).toContain('generativelanguage.googleapis.com')
    })
  })

  // claude 제공자
  describe('claude 제공자', () => {
    it('2xx 응답이면 keyValid=true 를 반환한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }))
      const result = await runQuickCheck('claude', 'sk-ant-valid')
      expect(result.keyValid).toBe(true)
    })

    it('401 응답이면 keyValid=false 를 반환한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      )
      const result = await runQuickCheck('claude', 'sk-ant-invalid')
      expect(result.keyValid).toBe(false)
    })

    it('Anthropic 엔드포인트를 호출한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }))
      await runQuickCheck('claude', 'sk-ant-key')
      const [[url]] = (fetch as ReturnType<typeof vi.fn>).mock.calls
      expect(url).toContain('api.anthropic.com')
    })
  })
})

// ── Ping 어댑터 테스트 ────────────────────────────────────────────

// LangChain 모듈 모킹
// Vitest 4.x: new 키워드와 함께 사용하는 mock에는 function 키워드 또는 class 필요
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(function () {
    return { invoke: vi.fn() }
  }),
}))

vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return { invoke: vi.fn() }
  }),
}))

vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn().mockImplementation(function () {
    return { invoke: vi.fn() }
  }),
}))

describe('runPingCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('단일 모델 성공 시 success=true, latencyMs >= 0, preview 를 반환한다', async () => {
    const { ChatOpenAI } = await import('@langchain/openai')
    const mockInvoke = vi.fn().mockResolvedValueOnce({
      content: 'Hello from OpenAI!',
    })
    vi.mocked(ChatOpenAI).mockImplementationOnce(
      function () {
        return { invoke: mockInvoke } as unknown as InstanceType<typeof ChatOpenAI>
      },
    )

    const results = await runPingCheck('chatgpt', 'sk-key', ['gpt-4o-mini'])
    expect(results).toHaveLength(1)
    expect(results[0]!.success).toBe(true)
    expect(results[0]!.latencyMs).toBeGreaterThanOrEqual(0)
    expect(results[0]!.preview).toBeDefined()
  })

  it('모델 호출 실패 시 success=false, error 를 반환한다', async () => {
    const { ChatOpenAI } = await import('@langchain/openai')
    vi.mocked(ChatOpenAI).mockImplementationOnce(
      function () {
        return {
          invoke: vi.fn().mockRejectedValueOnce(new Error('Model not found')),
        } as unknown as InstanceType<typeof ChatOpenAI>
      },
    )

    const results = await runPingCheck('chatgpt', 'sk-key', ['gpt-fake'])
    expect(results).toHaveLength(1)
    expect(results[0]!.success).toBe(false)
    expect(results[0]!.error).toContain('Model not found')
  })

  it('Promise.allSettled 로 혼합 성공/실패를 처리한다', async () => {
    const { ChatOpenAI } = await import('@langchain/openai')
    vi.mocked(ChatOpenAI)
      .mockImplementationOnce(
        function () {
          return {
            invoke: vi.fn().mockResolvedValueOnce({ content: 'OK' }),
          } as unknown as InstanceType<typeof ChatOpenAI>
        },
      )
      .mockImplementationOnce(
        function () {
          return {
            invoke: vi.fn().mockRejectedValueOnce(new Error('fail')),
          } as unknown as InstanceType<typeof ChatOpenAI>
        },
      )

    const results = await runPingCheck('chatgpt', 'sk-key', [
      'gpt-4o',
      'gpt-fake',
    ])
    expect(results).toHaveLength(2)
    const success = results.filter((r) => r.success)
    const fail = results.filter((r) => !r.success)
    expect(success).toHaveLength(1)
    expect(fail).toHaveLength(1)
  })

  it('응답 미리보기를 200자로 절단한다', async () => {
    const { ChatOpenAI } = await import('@langchain/openai')
    const longContent = 'A'.repeat(300)
    vi.mocked(ChatOpenAI).mockImplementationOnce(
      function () {
        return {
          invoke: vi.fn().mockResolvedValueOnce({ content: longContent }),
        } as unknown as InstanceType<typeof ChatOpenAI>
      },
    )

    const results = await runPingCheck('chatgpt', 'sk-key', ['gpt-4o'])
    expect(results[0]!.preview).toBeDefined()
    expect(results[0]!.preview!.length).toBeLessThanOrEqual(200)
  })

  it('동시성 상한(MAX_CONCURRENCY=3)을 준수한다', async () => {
    const { ChatOpenAI } = await import('@langchain/openai')
    let maxConcurrent = 0
    let current = 0

    // 각 모델 호출마다 동시 실행 수를 추적하는 mock
    vi.mocked(ChatOpenAI).mockImplementation(
      function () {
        return {
          invoke: vi.fn().mockImplementation(async () => {
            current++
            maxConcurrent = Math.max(maxConcurrent, current)
            await new Promise((resolve) => setTimeout(resolve, 10))
            current--
            return { content: 'ok' }
          }),
        } as unknown as InstanceType<typeof ChatOpenAI>
      },
    )

    // 5개 모델 동시 호출 시 최대 3개 이하로 제한
    await runPingCheck('chatgpt', 'sk-key', [
      'm1',
      'm2',
      'm3',
      'm4',
      'm5',
    ])
    expect(maxConcurrent).toBeLessThanOrEqual(3)
  })

  it('apiKey 원문이 에러 결과에 포함되지 않는다', async () => {
    const { ChatOpenAI } = await import('@langchain/openai')
    const secretKey = 'sk-super-secret-12345'
    vi.mocked(ChatOpenAI).mockImplementationOnce(
      function () {
        return {
          invoke: vi.fn().mockRejectedValueOnce(new Error(`Invalid key: ${secretKey}`)),
        } as unknown as InstanceType<typeof ChatOpenAI>
      },
    )

    const results = await runPingCheck('chatgpt', secretKey, ['gpt-4o'])
    // 에러 메시지에 키 원문이 노출되지 않아야 함
    if (results[0]!.error) {
      expect(results[0]!.error).not.toContain(secretKey)
    }
  })

  it('gemini 제공자로 ChatGoogleGenerativeAI 를 사용한다', async () => {
    const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai')
    const mockInvoke = vi.fn().mockResolvedValueOnce({ content: 'Gemini response' })
    vi.mocked(ChatGoogleGenerativeAI).mockImplementationOnce(
      function () {
        return { invoke: mockInvoke } as unknown as InstanceType<
          typeof ChatGoogleGenerativeAI
        >
      },
    )

    const results = await runPingCheck('gemini', 'AIza-key', [
      'gemini-2.0-flash',
    ])
    expect(results[0]!.success).toBe(true)
    expect(ChatGoogleGenerativeAI).toHaveBeenCalledOnce()
  })

  it('claude 제공자로 ChatAnthropic 을 사용한다', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic')
    const mockInvoke = vi.fn().mockResolvedValueOnce({ content: 'Claude response' })
    vi.mocked(ChatAnthropic).mockImplementationOnce(
      function () {
        return { invoke: mockInvoke } as unknown as InstanceType<typeof ChatAnthropic>
      },
    )

    const results = await runPingCheck('claude', 'sk-ant-key', [
      'claude-sonnet-4-20250514',
    ])
    expect(results[0]!.success).toBe(true)
    expect(ChatAnthropic).toHaveBeenCalledOnce()
  })
})
