// Batch API 어댑터 - 제공자별 배치 잡 제출 및 상태/결과 조회
// @MX:ANCHOR: batch 모드의 실제 외부 호출 처리 진입점
// @MX:REASON: route.ts와 batch-status/route.ts 두 곳에서 호출하는 서비스 레이어
//
// @MX:WARN: 배치 잡 제출은 실제 과금이 발생함. 취소해도 이미 처리된 요청은 청구됨
// @MX:REASON: quick/ping과 달리 제출 시점에 provider 측 작업 큐에 실제 등록됨
//
// LangChain 래퍼(ChatOpenAI 등)는 Batch API를 지원하지 않아 REST를 직접 호출한다.
// 모델 1개당 배치 잡 1개를 만들어 3개 제공자의 코드 경로와 결과 매핑을 통일한다.

import { redactApiKey } from './_adapters'
import type { BatchJob, BatchJobStatus, Provider } from './_validate'

// 외부 API 호출 타임아웃 (파일 업로드를 포함하므로 quick/ping보다 길게)
const TIMEOUT_MS = 30_000

// 동시 제출/조회 최대 개수
const MAX_CONCURRENCY = 3

// 미리보기 최대 길이 (문자 단위)
const MAX_PREVIEW_LENGTH = 200

// 배치 테스트에 사용할 최소 프롬프트
const TEST_PROMPT = 'Hi'

// 배치 요청에 부여할 고정 식별자 (모델당 잡 1개 = 요청 1건이므로 고정값으로 충분)
const CUSTOM_ID = 'batch-test-1'

// 폴링 결과 - BatchJob에서 model/jobId를 제외한 부분
interface PollOutcome {
  status: BatchJobStatus
  rawStatus: string
  preview?: string
  error?: string
  submittedAt?: string
  completedAt?: string
}

/**
 * 제공자별 배치 드라이버 계약
 * - submit: 배치 잡을 만들고 jobId 반환. 실패 시 throw
 * - poll: jobId의 현재 상태를 조회하고 완료 시 결과까지 수집. 실패 시 throw
 */
interface BatchDriver {
  submit(apiKey: string, model: string): Promise<string>
  poll(apiKey: string, jobId: string): Promise<PollOutcome>
}

// ── 공용 헬퍼 ─────────────────────────────────────────────

/** AbortController 기반 타임아웃을 적용한 fetch */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** 응답이 2xx가 아니면 상태코드를 담은 Error를 throw */
async function ensureOk(response: Response, context: string): Promise<Response> {
  if (response.ok) return response
  // 본문에 키가 반향될 가능성이 있어 상태코드만 사용하고 본문은 버림
  throw new Error(`${context} 실패 (HTTP ${response.status})`)
}

/** 미리보기 문자열 절단 */
function toPreview(text: string): string {
  return text.slice(0, MAX_PREVIEW_LENGTH)
}

/**
 * Unix 초 타임스탬프를 ISO 8601 문자열로 변환 (OpenAI 형식)
 * 값이 없거나 숫자가 아니면 undefined
 */
function unixSecondsToIso(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return new Date(value * 1000).toISOString()
}

/**
 * RFC 3339 문자열을 ISO 8601로 정규화 (Gemini/Claude 형식)
 * 파싱 불가한 값은 undefined
 */
function rfc3339ToIso(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

/** provider가 완료 시각을 주지 않을 때 사용할 서버 관측 시각 */
function observedNow(): string {
  return new Date().toISOString()
}

/** JSONL 텍스트의 첫 번째 유효 라인을 파싱 */
function parseFirstJsonLine(jsonl: string): unknown {
  const line = jsonl
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  if (!line) throw new Error('배치 결과가 비어 있습니다.')
  return JSON.parse(line)
}

// ── OpenAI ────────────────────────────────────────────────
// 파일 업로드(JSONL) → 배치 생성 → 상태 조회 → 결과 파일 다운로드

const openaiDriver: BatchDriver = {
  async submit(apiKey, model) {
    const authHeader = { Authorization: `Bearer ${apiKey}` }

    // 1) JSONL 입력 파일 업로드 (purpose=batch)
    // max_tokens류 파라미터는 모델 세대별로 이름이 달라 생략한다
    const jsonl = `${JSON.stringify({
      custom_id: CUSTOM_ID,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model,
        messages: [{ role: 'user', content: TEST_PROMPT }],
      },
    })}\n`

    const form = new FormData()
    form.append('purpose', 'batch')
    form.append('file', new Blob([jsonl], { type: 'application/jsonl' }), 'batch.jsonl')

    const uploadRes = await ensureOk(
      await fetchWithTimeout('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: authHeader,
        body: form,
      }),
      '입력 파일 업로드',
    )
    const uploaded = (await uploadRes.json()) as { id?: string }
    if (!uploaded.id) throw new Error('업로드 응답에 파일 ID가 없습니다.')

    // 2) 배치 생성
    const batchRes = await ensureOk(
      await fetchWithTimeout('https://api.openai.com/v1/batches', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_file_id: uploaded.id,
          endpoint: '/v1/chat/completions',
          completion_window: '24h',
        }),
      }),
      '배치 생성',
    )
    const batch = (await batchRes.json()) as { id?: string }
    if (!batch.id) throw new Error('배치 생성 응답에 ID가 없습니다.')

    return batch.id
  },

  async poll(apiKey, jobId) {
    const authHeader = { Authorization: `Bearer ${apiKey}` }

    const statusRes = await ensureOk(
      await fetchWithTimeout(`https://api.openai.com/v1/batches/${jobId}`, {
        headers: authHeader,
      }),
      '배치 상태 조회',
    )
    const batch = (await statusRes.json()) as {
      status?: string
      output_file_id?: string | null
      error_file_id?: string | null
      created_at?: number
      completed_at?: number
      failed_at?: number
      expired_at?: number
      cancelled_at?: number
    }
    const rawStatus = batch.status ?? 'unknown'
    // OpenAI 타임스탬프는 Unix 초 단위
    const submittedAt = unixSecondsToIso(batch.created_at)

    // 종료 실패 상태 - 상태별로 대응하는 종료 시각을 사용
    if (rawStatus === 'failed' || rawStatus === 'expired' || rawStatus === 'cancelled') {
      const endedAt =
        unixSecondsToIso(batch.failed_at) ??
        unixSecondsToIso(batch.expired_at) ??
        unixSecondsToIso(batch.cancelled_at)
      return {
        status: 'failed',
        rawStatus,
        error: `배치가 ${rawStatus} 상태로 종료되었습니다.`,
        submittedAt,
        completedAt: endedAt ?? observedNow(),
      }
    }

    // 아직 처리 중
    if (rawStatus !== 'completed') {
      return { status: 'pending', rawStatus, submittedAt }
    }

    const completedAt = unixSecondsToIso(batch.completed_at) ?? observedNow()

    // 완료 - 결과 파일 다운로드
    if (!batch.output_file_id) {
      return {
        status: 'failed',
        rawStatus,
        error: '완료되었으나 결과 파일이 없습니다.',
        submittedAt,
        completedAt,
      }
    }

    const contentRes = await ensureOk(
      await fetchWithTimeout(
        `https://api.openai.com/v1/files/${batch.output_file_id}/content`,
        { headers: authHeader },
      ),
      '결과 파일 다운로드',
    )
    const parsed = parseFirstJsonLine(await contentRes.text()) as {
      response?: { status_code?: number; body?: { choices?: { message?: { content?: string } }[] } }
      error?: unknown
    }

    if (parsed.error) {
      return {
        status: 'failed',
        rawStatus,
        error: '개별 요청이 실패했습니다.',
        submittedAt,
        completedAt,
      }
    }

    const content = parsed.response?.body?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return {
        status: 'failed',
        rawStatus,
        error: '결과에서 응답 텍스트를 찾지 못했습니다.',
        submittedAt,
        completedAt,
      }
    }

    return {
      status: 'succeeded',
      rawStatus,
      preview: toPreview(content),
      submittedAt,
      completedAt,
    }
  },
}

// ── Gemini ────────────────────────────────────────────────
// inline 요청으로 배치 생성 → 잡 이름(batches/xxx)으로 상태 조회

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

// 종료 실패로 간주하는 잡 상태
const GEMINI_FAILED_STATES = new Set([
  'JOB_STATE_FAILED',
  'JOB_STATE_CANCELLED',
  'JOB_STATE_EXPIRED',
])

const geminiDriver: BatchDriver = {
  async submit(apiKey, model) {
    const res = await ensureOk(
      await fetchWithTimeout(`${GEMINI_BASE}/models/${model}:batchGenerateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch: {
            display_name: `key-test-${model}`,
            input_config: {
              requests: {
                requests: [
                  {
                    request: { contents: [{ parts: [{ text: TEST_PROMPT }] }] },
                    metadata: { key: CUSTOM_ID },
                  },
                ],
              },
            },
          },
        }),
      }),
      '배치 생성',
    )
    const created = (await res.json()) as { name?: string }
    if (!created.name) throw new Error('배치 생성 응답에 잡 이름이 없습니다.')
    return created.name
  },

  async poll(apiKey, jobId) {
    // jobId는 "batches/xxx" 형태의 리소스 이름
    const res = await ensureOk(
      await fetchWithTimeout(`${GEMINI_BASE}/${jobId}`, {
        headers: { 'x-goog-api-key': apiKey },
      }),
      '배치 상태 조회',
    )
    const job = (await res.json()) as {
      state?: string
      metadata?: { state?: string; createTime?: string; endTime?: string; updateTime?: string }
      createTime?: string
      endTime?: string
      updateTime?: string
      response?: unknown
    }
    // 응답 스키마가 batch 리소스/operation 두 형태로 관측되어 양쪽을 모두 확인
    const rawStatus = job.state ?? job.metadata?.state ?? 'unknown'
    // Gemini 타임스탬프는 RFC 3339 문자열
    const submittedAt = rfc3339ToIso(job.createTime ?? job.metadata?.createTime)
    const endedAt = rfc3339ToIso(
      job.endTime ?? job.metadata?.endTime ?? job.updateTime ?? job.metadata?.updateTime,
    )

    if (GEMINI_FAILED_STATES.has(rawStatus)) {
      return {
        status: 'failed',
        rawStatus,
        error: `배치가 ${rawStatus} 상태로 종료되었습니다.`,
        submittedAt,
        completedAt: endedAt ?? observedNow(),
      }
    }

    if (rawStatus !== 'JOB_STATE_SUCCEEDED') {
      return { status: 'pending', rawStatus, submittedAt }
    }

    const completedAt = endedAt ?? observedNow()
    const text = extractGeminiText(job.response)
    if (text === null) {
      return {
        status: 'failed',
        rawStatus,
        error: '결과에서 응답 텍스트를 찾지 못했습니다.',
        submittedAt,
        completedAt,
      }
    }
    return {
      status: 'succeeded',
      rawStatus,
      preview: toPreview(text),
      submittedAt,
      completedAt,
    }
  },
}

/**
 * Gemini 배치 응답에서 첫 번째 생성 텍스트를 추출
 * inlinedResponses가 배열인 형태와 { inlinedResponses: [...] }로 한 겹 더 감싼 형태가
 * 모두 관측되어 두 경우를 함께 처리한다. 찾지 못하면 null
 */
function extractGeminiText(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null

  const container = (response as { inlinedResponses?: unknown }).inlinedResponses
  const list = Array.isArray(container)
    ? container
    : Array.isArray((container as { inlinedResponses?: unknown } | undefined)?.inlinedResponses)
      ? (container as { inlinedResponses: unknown[] }).inlinedResponses
      : null

  const first = list?.[0] as
    | { response?: { candidates?: { content?: { parts?: { text?: string }[] } }[] } }
    | undefined

  const text = first?.response?.candidates?.[0]?.content?.parts?.[0]?.text
  return typeof text === 'string' ? text : null
}

// ── Claude (Anthropic) ────────────────────────────────────
// Message Batches API - 생성 → processing_status 조회 → results_url JSONL 수집

const ANTHROPIC_HEADERS = (apiKey: string) => ({
  'x-api-key': apiKey,
  'anthropic-version': '2023-06-01',
})

// 배치 요청에 필수인 최소 토큰 수 (max_tokens는 1 이상이어야 함)
const CLAUDE_MAX_TOKENS = 16

const claudeDriver: BatchDriver = {
  async submit(apiKey, model) {
    const res = await ensureOk(
      await fetchWithTimeout('https://api.anthropic.com/v1/messages/batches', {
        method: 'POST',
        headers: { ...ANTHROPIC_HEADERS(apiKey), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              custom_id: CUSTOM_ID,
              params: {
                model,
                max_tokens: CLAUDE_MAX_TOKENS,
                messages: [{ role: 'user', content: TEST_PROMPT }],
              },
            },
          ],
        }),
      }),
      '배치 생성',
    )
    const batch = (await res.json()) as { id?: string }
    if (!batch.id) throw new Error('배치 생성 응답에 ID가 없습니다.')
    return batch.id
  },

  async poll(apiKey, jobId) {
    const res = await ensureOk(
      await fetchWithTimeout(`https://api.anthropic.com/v1/messages/batches/${jobId}`, {
        headers: ANTHROPIC_HEADERS(apiKey),
      }),
      '배치 상태 조회',
    )
    const batch = (await res.json()) as {
      processing_status?: string
      results_url?: string | null
      created_at?: string
      ended_at?: string
    }
    const rawStatus = batch.processing_status ?? 'unknown'
    // Claude 타임스탬프는 RFC 3339 문자열
    const submittedAt = rfc3339ToIso(batch.created_at)

    // in_progress / canceling은 아직 처리 중
    if (rawStatus !== 'ended') {
      return { status: 'pending', rawStatus, submittedAt }
    }

    const completedAt = rfc3339ToIso(batch.ended_at) ?? observedNow()

    if (!batch.results_url) {
      return {
        status: 'failed',
        rawStatus,
        error: '종료되었으나 결과 URL이 없습니다.',
        submittedAt,
        completedAt,
      }
    }

    const resultsRes = await ensureOk(
      await fetchWithTimeout(batch.results_url, { headers: ANTHROPIC_HEADERS(apiKey) }),
      '배치 결과 조회',
    )
    const parsed = parseFirstJsonLine(await resultsRes.text()) as {
      result?: { type?: string; message?: { content?: { type?: string; text?: string }[] } }
    }

    const resultType = parsed.result?.type
    if (resultType !== 'succeeded') {
      return {
        status: 'failed',
        rawStatus,
        error: `요청 결과가 ${resultType ?? 'unknown'} 상태입니다.`,
        submittedAt,
        completedAt,
      }
    }

    const text = parsed.result?.message?.content?.find((c) => c.type === 'text')?.text
    if (typeof text !== 'string') {
      return {
        status: 'failed',
        rawStatus,
        error: '결과에서 응답 텍스트를 찾지 못했습니다.',
        submittedAt,
        completedAt,
      }
    }

    return {
      status: 'succeeded',
      rawStatus,
      preview: toPreview(text),
      submittedAt,
      completedAt,
    }
  },
}

const BATCH_DRIVERS: Record<Provider, BatchDriver> = {
  chatgpt: openaiDriver,
  gemini: geminiDriver,
  claude: claudeDriver,
}

// ── 공개 API ──────────────────────────────────────────────

/**
 * 배열을 MAX_CONCURRENCY 단위 청크로 나눠 순차 실행하며 결과를 수집
 * Promise.allSettled로 부분 실패를 허용한다
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  task: (item: T) => Promise<R>,
  onReject: (item: T) => R,
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += MAX_CONCURRENCY) {
    const chunk = items.slice(i, i + MAX_CONCURRENCY)
    const settled = await Promise.allSettled(chunk.map(task))

    for (let j = 0; j < settled.length; j++) {
      const outcome = settled[j]!
      results.push(
        outcome.status === 'fulfilled' ? outcome.value : onReject(chunk[j] as T),
      )
    }
  }

  return results
}

/**
 * 선택된 모델마다 배치 잡을 1개씩 제출
 * 개별 모델 제출 실패는 해당 잡만 failed로 기록하고 나머지는 계속 진행
 * apiKey 원문은 에러 메시지에 절대 포함하지 않음
 */
export async function submitBatchJobs(
  provider: Provider,
  apiKey: string,
  models: string[],
): Promise<BatchJob[]> {
  const driver = BATCH_DRIVERS[provider]

  return mapWithConcurrency<string, BatchJob>(
    models,
    async (model) => {
      // 제출 직전 시각을 기록. 이후 폴링에서 provider가 보고한 created_at으로 대체됨
      const requestedAt = observedNow()
      try {
        const jobId = await driver.submit(apiKey, model)
        return {
          model,
          jobId,
          status: 'pending',
          rawStatus: 'submitted',
          submittedAt: requestedAt,
        }
      } catch (error) {
        return {
          model,
          jobId: null,
          status: 'failed',
          error: toSafeMessage(error, apiKey, '배치 제출 중 오류가 발생했습니다.'),
          submittedAt: requestedAt,
          completedAt: observedNow(),
        }
      }
    },
    (model) => ({
      model,
      jobId: null,
      status: 'failed',
      error: '예기치 않은 오류가 발생했습니다.',
      submittedAt: observedNow(),
      completedAt: observedNow(),
    }),
  )
}

/**
 * 제출된 배치 잡들의 현재 상태를 조회하고 완료된 잡은 결과까지 수집
 * 조회 실패한 잡은 pending으로 유지해 다음 폴링에서 재시도할 수 있게 한다
 */
export async function pollBatchJobs(
  provider: Provider,
  apiKey: string,
  jobs: { model: string; jobId: string }[],
): Promise<BatchJob[]> {
  const driver = BATCH_DRIVERS[provider]

  return mapWithConcurrency<{ model: string; jobId: string }, BatchJob>(
    jobs,
    async ({ model, jobId }) => {
      try {
        const outcome = await driver.poll(apiKey, jobId)
        return { model, jobId, ...outcome }
      } catch (error) {
        // 일시적 네트워크/rate limit 오류로 잡을 죽이지 않도록 pending 유지
        return {
          model,
          jobId,
          status: 'pending',
          rawStatus: 'poll_error',
          error: toSafeMessage(error, apiKey, '상태 조회 중 오류가 발생했습니다.'),
        }
      }
    },
    ({ model, jobId }) => ({
      model,
      jobId,
      status: 'pending',
      rawStatus: 'poll_error',
      error: '예기치 않은 오류가 발생했습니다.',
    }),
  )
}

/** Error 메시지에서 apiKey를 마스킹하고, Error가 아니면 기본 메시지로 대체 */
function toSafeMessage(error: unknown, apiKey: string, fallback: string): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return 'timeout: 응답 시간이 초과되었습니다.'
    return redactApiKey(error.message, apiKey)
  }
  return fallback
}
