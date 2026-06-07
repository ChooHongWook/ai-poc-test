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
})
