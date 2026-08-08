// _batch-adapters.ts 단위 테스트 - provider별 배치 제출/폴링
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { submitBatchJobs, pollBatchJobs } from '../_batch-adapters'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

function jsonlResponse(lines: unknown[], status = 200): Response {
  return new Response(lines.map((l) => JSON.stringify(l)).join('\n'), { status })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ── submitBatchJobs ───────────────────────────────────────────

describe('submitBatchJobs', () => {
  it('chatgpt: 파일 업로드 후 배치를 생성하고 jobId 를 반환한다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ id: 'file-123' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'batch_abc', status: 'validating' }))

    const jobs = await submitBatchJobs('chatgpt', 'sk-key', ['gpt-5.4-mini'])

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      model: 'gpt-5.4-mini',
      jobId: 'batch_abc',
      status: 'pending',
    })
    // 제출 시각이 기록되고 완료 시각은 아직 없음
    expect(jobs[0]!.submittedAt).toBeDefined()
    expect(jobs[0]!.completedAt).toBeUndefined()
    // 1회차 업로드, 2회차 배치 생성
    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe('https://api.openai.com/v1/files')
    expect(vi.mocked(fetch).mock.calls[1]![0]).toBe('https://api.openai.com/v1/batches')
  })

  it('gemini: 잡 이름(batches/xxx)을 jobId 로 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ name: 'batches/999' }))

    const jobs = await submitBatchJobs('gemini', 'g-key', ['gemini-2.5-flash'])

    expect(jobs[0]).toMatchObject({ jobId: 'batches/999', status: 'pending' })
    expect(vi.mocked(fetch).mock.calls[0]![0]).toContain(
      'models/gemini-2.5-flash:batchGenerateContent',
    )
  })

  it('claude: 배치 ID 를 jobId 로 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ id: 'msgbatch_01' }))

    const jobs = await submitBatchJobs('claude', 'ant-key', ['claude-sonnet-4-6'])

    expect(jobs[0]).toMatchObject({ jobId: 'msgbatch_01', status: 'pending' })
    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe(
      'https://api.anthropic.com/v1/messages/batches',
    )
  })

  it('제출이 실패하면 해당 잡만 failed 로 기록한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'nope' }, 400))

    const jobs = await submitBatchJobs('claude', 'ant-key', ['claude-sonnet-4-6'])

    expect(jobs[0]).toMatchObject({ jobId: null, status: 'failed' })
    expect(jobs[0]!.error).toContain('400')
  })

  it('일부 모델이 실패해도 나머지 모델은 계속 제출한다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ id: 'msgbatch_ok' }))
      .mockResolvedValueOnce(jsonResponse({}, 500))

    const jobs = await submitBatchJobs('claude', 'ant-key', ['model-a', 'model-b'])

    expect(jobs).toHaveLength(2)
    expect(jobs[0]!.status).toBe('pending')
    expect(jobs[1]!.status).toBe('failed')
  })

  it('에러 메시지에 apiKey 원문이 포함되지 않는다', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('bad key ant-secret-key used'))

    const jobs = await submitBatchJobs('claude', 'ant-secret-key', ['m'])

    expect(jobs[0]!.error).not.toContain('ant-secret-key')
    expect(jobs[0]!.error).toContain('[REDACTED]')
  })
})

// ── pollBatchJobs ─────────────────────────────────────────────

describe('pollBatchJobs', () => {
  const target = [{ model: 'm', jobId: 'job-1' }]

  it('chatgpt: 처리 중이면 pending 을 유지한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ status: 'in_progress' }))

    const jobs = await pollBatchJobs('chatgpt', 'sk-key', target)

    expect(jobs[0]).toMatchObject({ status: 'pending', rawStatus: 'in_progress' })
  })

  it('chatgpt: 완료되면 결과 파일에서 응답 텍스트를 추출한다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ status: 'completed', output_file_id: 'file-out' }),
      )
      .mockResolvedValueOnce(
        jsonlResponse([
          {
            custom_id: 'batch-test-1',
            response: {
              status_code: 200,
              body: { choices: [{ message: { content: 'Hello there' } }] },
            },
            error: null,
          },
        ]),
      )

    const jobs = await pollBatchJobs('chatgpt', 'sk-key', target)

    expect(jobs[0]).toMatchObject({ status: 'succeeded', preview: 'Hello there' })
  })

  it('chatgpt: failed/expired/cancelled 는 failed 로 종료한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ status: 'expired' }))

    const jobs = await pollBatchJobs('chatgpt', 'sk-key', target)

    expect(jobs[0]!.status).toBe('failed')
  })

  it('gemini: JOB_STATE_SUCCEEDED 이면 inline 응답에서 텍스트를 추출한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        state: 'JOB_STATE_SUCCEEDED',
        response: {
          inlinedResponses: {
            inlinedResponses: [
              { response: { candidates: [{ content: { parts: [{ text: '안녕' }] } }] } },
            ],
          },
        },
      }),
    )

    const jobs = await pollBatchJobs('gemini', 'g-key', target)

    expect(jobs[0]).toMatchObject({ status: 'succeeded', preview: '안녕' })
  })

  it('gemini: inlinedResponses 가 배열로 오는 형태도 처리한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        state: 'JOB_STATE_SUCCEEDED',
        response: {
          inlinedResponses: [
            { response: { candidates: [{ content: { parts: [{ text: 'flat' }] } }] } },
          ],
        },
      }),
    )

    const jobs = await pollBatchJobs('gemini', 'g-key', target)

    expect(jobs[0]).toMatchObject({ status: 'succeeded', preview: 'flat' })
  })

  it('gemini: JOB_STATE_RUNNING 이면 pending 을 유지한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ state: 'JOB_STATE_RUNNING' }))

    const jobs = await pollBatchJobs('gemini', 'g-key', target)

    expect(jobs[0]!.status).toBe('pending')
  })

  it('claude: ended + succeeded 이면 message 텍스트를 추출한다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          processing_status: 'ended',
          results_url: 'https://api.anthropic.com/results/1',
        }),
      )
      .mockResolvedValueOnce(
        jsonlResponse([
          {
            custom_id: 'batch-test-1',
            result: {
              type: 'succeeded',
              message: { content: [{ type: 'text', text: 'Hi!' }] },
            },
          },
        ]),
      )

    const jobs = await pollBatchJobs('claude', 'ant-key', target)

    expect(jobs[0]).toMatchObject({ status: 'succeeded', preview: 'Hi!' })
  })

  it('claude: in_progress 이면 pending 을 유지한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ processing_status: 'in_progress', results_url: null }),
    )

    const jobs = await pollBatchJobs('claude', 'ant-key', target)

    expect(jobs[0]!.status).toBe('pending')
  })

  it('claude: 개별 요청이 errored 이면 failed 로 기록한다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ processing_status: 'ended', results_url: 'https://x/1' }),
      )
      .mockResolvedValueOnce(
        jsonlResponse([{ custom_id: 'batch-test-1', result: { type: 'errored' } }]),
      )

    const jobs = await pollBatchJobs('claude', 'ant-key', target)

    expect(jobs[0]!.status).toBe('failed')
    expect(jobs[0]!.error).toContain('errored')
  })

  it('조회 자체가 실패하면 pending 을 유지해 다음 폴링에서 재시도한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 500))

    const jobs = await pollBatchJobs('chatgpt', 'sk-key', target)

    expect(jobs[0]).toMatchObject({ status: 'pending', rawStatus: 'poll_error' })
    expect(jobs[0]!.jobId).toBe('job-1')
  })

  it('chatgpt: created_at/completed_at(Unix 초)을 ISO 로 변환한다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          status: 'completed',
          output_file_id: 'file-out',
          created_at: 1_775_000_000,
          completed_at: 1_775_000_930,
        }),
      )
      .mockResolvedValueOnce(
        jsonlResponse([
          { response: { status_code: 200, body: { choices: [{ message: { content: 'ok' } }] } } },
        ]),
      )

    const jobs = await pollBatchJobs('chatgpt', 'sk-key', target)

    expect(jobs[0]!.submittedAt).toBe(new Date(1_775_000_000_000).toISOString())
    expect(jobs[0]!.completedAt).toBe(new Date(1_775_000_930_000).toISOString())
  })

  it('chatgpt: 처리 중에도 제출 시각은 제공한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ status: 'in_progress', created_at: 1_775_000_000 }),
    )

    const jobs = await pollBatchJobs('chatgpt', 'sk-key', target)

    expect(jobs[0]!.submittedAt).toBe(new Date(1_775_000_000_000).toISOString())
    expect(jobs[0]!.completedAt).toBeUndefined()
  })

  it('chatgpt: 실패 상태에서는 failed_at 을 완료 시각으로 쓴다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ status: 'failed', created_at: 1_775_000_000, failed_at: 1_775_000_100 }),
    )

    const jobs = await pollBatchJobs('chatgpt', 'sk-key', target)

    expect(jobs[0]!.completedAt).toBe(new Date(1_775_000_100_000).toISOString())
  })

  it('gemini: createTime/endTime(RFC 3339)을 ISO 로 정규화한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        state: 'JOB_STATE_SUCCEEDED',
        createTime: '2026-08-08T01:00:00Z',
        endTime: '2026-08-08T01:12:30Z',
        response: {
          inlinedResponses: [
            { response: { candidates: [{ content: { parts: [{ text: 'ok' }] } }] } },
          ],
        },
      }),
    )

    const jobs = await pollBatchJobs('gemini', 'g-key', target)

    expect(jobs[0]!.submittedAt).toBe('2026-08-08T01:00:00.000Z')
    expect(jobs[0]!.completedAt).toBe('2026-08-08T01:12:30.000Z')
  })

  it('claude: created_at/ended_at 을 ISO 로 정규화한다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          processing_status: 'ended',
          results_url: 'https://x/1',
          created_at: '2026-08-08T01:00:00.100435Z',
          ended_at: '2026-08-08T01:30:00.000Z',
        }),
      )
      .mockResolvedValueOnce(
        jsonlResponse([
          { result: { type: 'succeeded', message: { content: [{ type: 'text', text: 'ok' }] } } },
        ]),
      )

    const jobs = await pollBatchJobs('claude', 'ant-key', target)

    expect(jobs[0]!.submittedAt).toBe('2026-08-08T01:00:00.100Z')
    expect(jobs[0]!.completedAt).toBe('2026-08-08T01:30:00.000Z')
  })

  it('provider 가 완료 시각을 주지 않으면 서버 관측 시각으로 대체한다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ processing_status: 'ended', results_url: 'https://x/1' }),
      )
      .mockResolvedValueOnce(
        jsonlResponse([
          { result: { type: 'succeeded', message: { content: [{ type: 'text', text: 'ok' }] } } },
        ]),
      )

    const before = Date.now()
    const jobs = await pollBatchJobs('claude', 'ant-key', target)
    const completedAt = new Date(jobs[0]!.completedAt!).getTime()

    expect(completedAt).toBeGreaterThanOrEqual(before)
    expect(completedAt).toBeLessThanOrEqual(Date.now())
  })

  it('AbortError 는 timeout 메시지로 변환한다', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      Object.assign(new Error('aborted'), { name: 'AbortError' }),
    )

    const jobs = await pollBatchJobs('chatgpt', 'sk-key', target)

    expect(jobs[0]!.error).toMatch(/timeout/i)
  })
})
