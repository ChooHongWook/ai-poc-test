// @vitest-environment jsdom
// TASK-006: ProviderCard 컴포넌트 통합 테스트
// jsdom 환경 지정 - 글로벌 환경(node)에 영향 없음

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import React from 'react'

// AIConfigProvider mock - localStorage 없이 동작
vi.mock('@/lib/providers/ai-config-provider', () => ({
  useAIConfig: vi.fn(),
}))

// sonner toast mock
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

import { useAIConfig } from '@/lib/providers/ai-config-provider'
import { ProviderCard } from '../ProviderCard'

// 기본 provider 상태
const makeProviderState = (overrides = {}) => ({
  enabled: true,
  apiKey: 'sk-test-key-12345',
  model: 'gpt-4o-mini',
  ...overrides,
})

const mockSetChatGPT = vi.fn()

function setupMock(state = makeProviderState()) {
  vi.mocked(useAIConfig).mockReturnValue({
    chatgpt: state,
    gemini: makeProviderState({ apiKey: 'AIza-gemini', model: 'gemini-2.0-flash' }),
    claude: makeProviderState({ apiKey: 'sk-ant-claude', model: 'claude-sonnet-4-20250514' }),
    setChatGPT: mockSetChatGPT,
    setGemini: vi.fn(),
    setClaude: vi.fn(),
  })
}

describe('ProviderCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    setupMock()
  })

  // ── 렌더링 테스트 ────────────────────────────────────────────
  describe('초기 렌더링', () => {
    it('제공자 이름이 표시된다', () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      expect(screen.getByText('ChatGPT (OpenAI)')).toBeInTheDocument()
    })

    it('Test 버튼이 렌더링된다', () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument()
    })

    it('enabled=true, apiKey 있으면 Test 버튼이 활성화된다', () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const testBtn = screen.getByRole('button', { name: /test/i })
      expect(testBtn).not.toBeDisabled()
    })

    it('enabled=false 이면 Test 버튼이 비활성화된다', () => {
      setupMock(makeProviderState({ enabled: false }))
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const testBtn = screen.getByRole('button', { name: /test/i })
      expect(testBtn).toBeDisabled()
    })

    it('apiKey 입력 필드에 apiKey가 표시된다', () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const input = screen.getByDisplayValue('sk-test-key-12345')
      expect(input).toBeInTheDocument()
    })
  })

  // ── 보안 테스트 ───────────────────────────────────────────────
  describe('보안', () => {
    it('apiKey 입력 필드는 password 타입이다', () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      // 타입이 password인 input이 존재해야 함 (DOM에 평문 노출 방지)
      const inputs = document.querySelectorAll('input[type="password"]')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('apiKey 원문이 DOM 텍스트에 평문으로 노출되지 않는다', async () => {
      const secretKey = 'sk-test-key-12345'
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)

      // DOM 텍스트 콘텐츠에서 키 평문 검색
      const bodyText = document.body.textContent ?? ''
      // password 타입 input 값은 textContent에 포함되지 않아야 함
      // (input value는 textContent에 포함되지 않으므로 확인)
      const textNodes = Array.from(document.body.querySelectorAll('*'))
        .filter((el) => el.children.length === 0)
        .map((el) => el.textContent ?? '')
        .join('')
      expect(textNodes).not.toContain(secretKey)
    })
  })

  // ── 테스트 실행 및 결과 표시 ──────────────────────────────────
  describe('quick 모드 테스트 실행', () => {
    it('Test 버튼 클릭 시 /api/test-key 로 POST 요청한다', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ keyValid: true }), { status: 200 }),
      )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()
      const testBtn = screen.getByRole('button', { name: /test/i })

      await user.click(testBtn)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/test-key',
          expect.objectContaining({ method: 'POST' }),
        )
      })
    })

    it('keyValid=true 이면 성공 Badge를 표시한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ keyValid: true }), { status: 200 }),
      )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /test/i }))

      await waitFor(() => {
        expect(screen.getByText(/유효/i)).toBeInTheDocument()
      })
    })

    it('keyValid=false 이면 오류 Badge를 표시한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({ keyValid: false, keyError: '인증 실패' }),
          { status: 200 },
        ),
      )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /test/i }))

      await waitFor(() => {
        // '무효' Badge와 '인증 실패' 메시지가 모두 표시되어야 함
        const allMatches = screen.getAllByText(/무효|실패|invalid/i)
        expect(allMatches.length).toBeGreaterThan(0)
      })
    })
  })

  // ── ping 모드 테스트 ──────────────────────────────────────────
  describe('ping 모드 테스트 결과', () => {
    it('ping 결과 모델 행이 렌더링된다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            keyValid: true,
            results: [
              { model: 'gpt-4o', success: true, latencyMs: 100, preview: 'Hi' },
            ],
          }),
          { status: 200 },
        ),
      )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      // ping 모드로 전환 (mode toggle이 있으면)
      const pingToggle = screen.queryByRole('radio', { name: /ping/i }) ??
        screen.queryByLabelText(/ping/i)
      if (pingToggle) {
        await user.click(pingToggle)
      }

      await user.click(screen.getByRole('button', { name: /test/i }))

      await waitFor(() => {
        // 결과 패널이 렌더링되어야 함
        expect(screen.getByText('gpt-4o')).toBeInTheDocument()
      })
    })
  })

  // ── 새 기능 테스트 (RED 페이즈) ──────────────────────────────
  describe('모델 체크박스 항상 표시', () => {
    it('quick 모드에서도 모델 체크박스가 렌더링된다', () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      // quick 모드가 기본값이므로 체크박스가 즉시 보여야 함
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('ping 모드에서도 모델 체크박스가 렌더링된다', async () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()
      const pingRadio = screen.getByRole('radio', { name: /ping/i })
      await user.click(pingRadio)
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })

  describe('기타(커스텀) 모델 추가', () => {
    it('기타 입력창에 타이핑 후 추가 버튼 클릭 시 선택 요약에 모델이 나타난다', async () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      const customInput = screen.getByPlaceholderText(/기타|직접 입력|모델 ID/i)
      await user.type(customInput, 'my-custom-model')

      const addButton = screen.getByRole('button', { name: /추가/i })
      await user.click(addButton)

      // 선택된 모델 요약 영역에 커스텀 모델이 나타나야 함
      await waitFor(() => {
        expect(screen.getByTestId('selected-models-summary')).toBeInTheDocument()
        expect(screen.getByText('my-custom-model')).toBeInTheDocument()
      })
    })

    it('Enter 키로도 커스텀 모델을 추가할 수 있다', async () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      const customInput = screen.getByPlaceholderText(/기타|직접 입력|모델 ID/i)
      await user.type(customInput, 'enter-model{Enter}')

      await waitFor(() => {
        expect(screen.getByText('enter-model')).toBeInTheDocument()
      })
    })

    it('추가 후 입력창이 비워진다', async () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      const customInput = screen.getByPlaceholderText(/기타|직접 입력|모델 ID/i)
      await user.type(customInput, 'some-model')
      await user.click(screen.getByRole('button', { name: /추가/i }))

      await waitFor(() => {
        expect(customInput).toHaveValue('')
      })
    })

    it('중복 커스텀 모델을 추가해도 두 번 나타나지 않는다', async () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      const customInput = screen.getByPlaceholderText(/기타|직접 입력|모델 ID/i)
      await user.type(customInput, 'dup-model')
      await user.click(screen.getByRole('button', { name: /추가/i }))
      await user.type(customInput, 'dup-model')
      await user.click(screen.getByRole('button', { name: /추가/i }))

      await waitFor(() => {
        const chips = screen.getAllByText('dup-model')
        expect(chips).toHaveLength(1)
      })
    })
  })

  describe('빌트인 모델 선택 후 요약 표시', () => {
    it('빌트인 모델 체크박스 선택 시 요약 섹션에 해당 모델 label이 나타난다', async () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      // GPT-5.5 체크박스를 클릭 (label 텍스트로 찾기)
      const gptLabel = screen.getByText('GPT-5.5')
      await user.click(gptLabel)

      await waitFor(() => {
        const summary = screen.getByTestId('selected-models-summary')
        expect(summary).toBeInTheDocument()
        // 요약 안에 GPT-5.5 텍스트가 있어야 함
        expect(summary).toHaveTextContent('GPT-5.5')
      })
    })
  })

  describe('모델 목록 출처 링크', () => {
    it('공식 문서 출처 링크가 올바른 href로 렌더링된다', () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const link = screen.getByRole('link', { name: /OpenAI 공식 모델 문서/i })
      expect(link).toHaveAttribute(
        'href',
        'https://developers.openai.com/api/docs/models',
      )
      expect(link).toHaveAttribute('target', '_blank')
    })
  })

  describe('배치(Batch) 문서 링크', () => {
    it.each([
      [
        'chatgpt',
        'ChatGPT (OpenAI)',
        /OpenAI Batch 요금 문서/i,
        'https://developers.openai.com/api/docs/pricing?latest-pricing=batch',
      ],
      [
        'gemini',
        'Gemini (Google)',
        /Gemini Batch API 문서/i,
        'https://ai.google.dev/gemini-api/docs/batch-api',
      ],
      [
        'claude',
        'Claude (Anthropic)',
        /Claude 배치 처리 문서/i,
        'https://platform.claude.com/docs/ko/build-with-claude/batch-processing',
      ],
    ])(
      '%s 카드에 배치 문서 링크가 올바른 href로 렌더링된다',
      (provider, label, linkName, expectedHref) => {
        render(
          <ProviderCard name={provider as 'chatgpt' | 'gemini' | 'claude'} label={label} />,
        )
        const link = screen.getByRole('link', { name: linkName })
        expect(link).toHaveAttribute('href', expectedHref)
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      },
    )
  })

  describe('Batch 테스트 모드', () => {
    it('Batch 라디오 버튼이 렌더링된다', () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      expect(screen.getByLabelText('batch')).toBeInTheDocument()
    })

    it('Batch 모드를 선택하면 과금 경고가 표시된다', async () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      expect(screen.queryByTestId('chatgpt-batch-warning')).not.toBeInTheDocument()

      await user.click(screen.getByLabelText('batch'))

      await waitFor(() => {
        expect(screen.getByTestId('chatgpt-batch-warning')).toBeInTheDocument()
      })
    })

    it('Batch 모드에서 모델을 선택하지 않으면 Test 버튼이 비활성화된다', async () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      const testButton = screen.getByRole('button', { name: /^Test$/i })
      expect(testButton).toBeEnabled()

      await user.click(screen.getByLabelText('batch'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Test$/i })).toBeDisabled()
      })
    })

    it('배치 제출 결과의 잡 목록과 jobId 가 표시된다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            keyValid: true,
            batchJobs: [
              {
                model: 'gpt-5.5',
                jobId: 'batch_abc123',
                status: 'pending',
                rawStatus: 'submitted',
              },
            ],
          }),
          { status: 200 },
        ),
      )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      await user.click(screen.getByLabelText('batch'))
      await user.click(screen.getByText('GPT-5.5'))
      await user.click(screen.getByRole('button', { name: /^Test$/i }))

      await waitFor(() => {
        expect(screen.getByTestId('batch-result-panel')).toBeInTheDocument()
        expect(screen.getByTestId('batch-job-gpt-5.5')).toHaveTextContent('batch_abc123')
        expect(screen.getByTestId('batch-job-gpt-5.5')).toHaveTextContent('진행 중')
      })
    })

    it('mode=batch 와 선택 모델을 요청 본문에 담아 보낸다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ keyValid: true, batchJobs: [] }), { status: 200 }),
      )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      await user.click(screen.getByLabelText('batch'))
      await user.click(screen.getByText('GPT-5.5'))
      await user.click(screen.getByRole('button', { name: /^Test$/i }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/test-key', expect.anything())
      })
      const [, init] = vi.mocked(fetch).mock.calls[0]!
      const sent = JSON.parse(String((init as RequestInit).body))
      expect(sent.mode).toBe('batch')
      expect(sent.models).toEqual(['gpt-5.5'])
    })

    it('상태 새로고침 버튼이 batch-status 를 호출하고 결과를 병합한다', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              keyValid: true,
              batchJobs: [{ model: 'gpt-5.5', jobId: 'batch_abc', status: 'pending' }],
            }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              jobs: [
                {
                  model: 'gpt-5.5',
                  jobId: 'batch_abc',
                  status: 'succeeded',
                  preview: '안녕하세요',
                },
              ],
            }),
            { status: 200 },
          ),
        )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      await user.click(screen.getByLabelText('batch'))
      await user.click(screen.getByText('GPT-5.5'))
      await user.click(screen.getByRole('button', { name: /^Test$/i }))

      await waitFor(() => {
        expect(screen.getByTestId('batch-result-panel')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /상태 새로고침/i }))

      await waitFor(() => {
        const row = screen.getByTestId('batch-job-gpt-5.5')
        expect(row).toHaveTextContent('완료')
        expect(row).toHaveTextContent('안녕하세요')
      })

      expect(fetch).toHaveBeenLastCalledWith(
        '/api/test-key/batch-status',
        expect.anything(),
      )
    })

    it('제출 직후에는 전송 시각과 수신 대기 중이 표시된다', async () => {
      const submittedAt = new Date(2026, 7, 8, 9, 30, 0).toISOString()
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            keyValid: true,
            batchJobs: [
              { model: 'gpt-5.5', jobId: 'batch_abc', status: 'pending', submittedAt },
            ],
          }),
          { status: 200 },
        ),
      )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      await user.click(screen.getByLabelText('batch'))
      await user.click(screen.getByText('GPT-5.5'))
      await user.click(screen.getByRole('button', { name: /^Test$/i }))

      await waitFor(() => {
        const times = screen.getByTestId('batch-time-gpt-5.5')
        expect(times).toHaveTextContent('전송 09:30:00')
        expect(times).toHaveTextContent('수신 대기 중')
      })
    })

    it('완료되면 수신 시각과 소요 시간이 표시된다', async () => {
      const submittedAt = new Date(2026, 7, 8, 9, 30, 0).toISOString()
      const completedAt = new Date(2026, 7, 8, 9, 33, 20).toISOString()

      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              keyValid: true,
              batchJobs: [
                { model: 'gpt-5.5', jobId: 'batch_abc', status: 'pending', submittedAt },
              ],
            }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              jobs: [
                {
                  model: 'gpt-5.5',
                  jobId: 'batch_abc',
                  status: 'succeeded',
                  preview: 'Hi',
                  submittedAt,
                  completedAt,
                },
              ],
            }),
            { status: 200 },
          ),
        )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      await user.click(screen.getByLabelText('batch'))
      await user.click(screen.getByText('GPT-5.5'))
      await user.click(screen.getByRole('button', { name: /^Test$/i }))

      await waitFor(() => {
        expect(screen.getByTestId('batch-result-panel')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /상태 새로고침/i }))

      await waitFor(() => {
        const times = screen.getByTestId('batch-time-gpt-5.5')
        expect(times).toHaveTextContent('전송 09:30:00')
        expect(times).toHaveTextContent('수신 09:33:20')
        expect(times).toHaveTextContent('소요 3분 20초')
      })
    })

    it('폴링 응답에 submittedAt 이 없어도 전송 시각이 유지된다', async () => {
      const submittedAt = new Date(2026, 7, 8, 9, 30, 0).toISOString()

      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              keyValid: true,
              batchJobs: [
                { model: 'gpt-5.5', jobId: 'batch_abc', status: 'pending', submittedAt },
              ],
            }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              jobs: [
                { model: 'gpt-5.5', jobId: 'batch_abc', status: 'succeeded', preview: 'Hi' },
              ],
            }),
            { status: 200 },
          ),
        )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      await user.click(screen.getByLabelText('batch'))
      await user.click(screen.getByText('GPT-5.5'))
      await user.click(screen.getByRole('button', { name: /^Test$/i }))

      await waitFor(() => {
        expect(screen.getByTestId('batch-result-panel')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /상태 새로고침/i }))

      await waitFor(() => {
        expect(screen.getByTestId('batch-job-gpt-5.5')).toHaveTextContent('완료')
      })
      expect(screen.getByTestId('batch-time-gpt-5.5')).toHaveTextContent('전송 09:30:00')
    })

    it('모드를 전환하면 이전 배치 결과가 사라진다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            keyValid: true,
            batchJobs: [{ model: 'gpt-5.5', jobId: 'batch_abc', status: 'pending' }],
          }),
          { status: 200 },
        ),
      )

      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      await user.click(screen.getByLabelText('batch'))
      await user.click(screen.getByText('GPT-5.5'))
      await user.click(screen.getByRole('button', { name: /^Test$/i }))

      await waitFor(() => {
        expect(screen.getByTestId('batch-result-panel')).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('quick'))

      await waitFor(() => {
        expect(screen.queryByTestId('batch-result-panel')).not.toBeInTheDocument()
      })
    })
  })

  describe('요약 섹션 × 제거 기능', () => {
    it('요약 섹션의 × 버튼 클릭 시 해당 모델 chip이 제거된다', async () => {
      render(<ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />)
      const user = userEvent.setup()

      // 커스텀 모델 추가
      const customInput = screen.getByPlaceholderText(/기타|직접 입력|모델 ID/i)
      await user.type(customInput, 'remove-me')
      await user.click(screen.getByRole('button', { name: /추가/i }))

      // chip이 나타날 때까지 기다림
      await waitFor(() => {
        expect(screen.getByText('remove-me')).toBeInTheDocument()
      })

      // × 버튼 클릭
      const removeBtn = screen.getByRole('button', { name: /remove-me 제거|×/i })
      await user.click(removeBtn)

      await waitFor(() => {
        expect(screen.queryByText('remove-me')).not.toBeInTheDocument()
      })
    })
  })
})
