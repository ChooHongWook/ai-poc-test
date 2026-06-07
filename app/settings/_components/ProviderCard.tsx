'use client'

// AI 제공자 설정 카드 컴포넌트 - API Key 테스트 기능 포함
// @MX:NOTE: quick 모드(인증 확인만)와 ping 모드(실제 모델 호출) 지원

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAIConfig } from '@/lib/providers/ai-config-provider'
import {
  OPENAI_MODEL_OPTIONS,
  GEMINI_MODEL_OPTIONS,
  CLAUDE_MODEL_OPTIONS,
} from '@/lib/constants/ai-models'
import { isTestDisabled, toggleModel } from '@/app/settings/_lib/test-key-ui'
import { TestResultPanel } from './TestResultPanel'
import type { TestKeyResponse, Provider } from '@/app/api/test-key/_validate'

interface ProviderCardProps {
  name: Provider
  label: string
}

/**
 * AI 제공자 설정 카드
 * - API Key 입력 및 활성화 토글
 * - quick/ping 모드 선택
 * - 모델 체크박스 목록 (ping 모드에서 표시)
 * - Test 버튼 및 결과 표시
 */
export function ProviderCard({ name, label }: ProviderCardProps) {
  const { chatgpt, gemini, claude, setChatGPT, setGemini, setClaude } = useAIConfig()

  // 제공자별 상태·업데이트 함수·모델 옵션을 단일 맵으로 통합
  const providerMap = {
    chatgpt: { state: chatgpt, setter: setChatGPT, modelOptions: OPENAI_MODEL_OPTIONS },
    gemini: { state: gemini, setter: setGemini, modelOptions: GEMINI_MODEL_OPTIONS },
    claude: { state: claude, setter: setClaude, modelOptions: CLAUDE_MODEL_OPTIONS },
  }

  const { state, setter, modelOptions } = providerMap[name]

  // 테스트 상태
  const [testMode, setTestMode] = useState<'quick' | 'ping'>('quick')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestKeyResponse | null>(null)

  const disabled = isTestDisabled({
    enabled: state.enabled,
    apiKey: state.apiKey,
    loading,
  })

  // 테스트 버튼 핸들러
  async function handleTest() {
    if (disabled) return
    setLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: name,
          apiKey: state.apiKey,
          mode: testMode,
          models: selectedModels,
        }),
      })

      const data = (await response.json()) as TestKeyResponse
      setTestResult(data)

      if (data.keyValid) {
        toast.success(`${label} API Key 검증 성공`)
      } else {
        toast.error(`${label} API Key 검증 실패: ${data.keyError ?? '알 수 없는 오류'}`)
      }
    } catch {
      toast.error('테스트 중 네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{label}</CardTitle>
          <Switch
            checked={state.enabled}
            onCheckedChange={(enabled) => setter({ ...state, enabled })}
            aria-label={`${label} 활성화`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key 입력 */}
        <div className="space-y-2">
          <Label htmlFor={`${name}-apikey`}>API Key</Label>
          <Input
            id={`${name}-apikey`}
            type="password"
            placeholder="API Key를 입력하세요"
            value={state.apiKey}
            onChange={(e) => setter({ ...state, apiKey: e.target.value })}
            disabled={!state.enabled}
          />
        </div>

        {/* 모델 입력 */}
        <div className="space-y-2">
          <Label htmlFor={`${name}-model`}>모델</Label>
          <Input
            id={`${name}-model`}
            placeholder="모델명을 입력하세요"
            value={state.model}
            onChange={(e) => setter({ ...state, model: e.target.value })}
            disabled={!state.enabled}
          />
        </div>

        {/* 테스트 모드 선택 */}
        <div className="space-y-2">
          <Label>테스트 모드</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`${name}-mode`}
                value="quick"
                checked={testMode === 'quick'}
                onChange={() => setTestMode('quick')}
                aria-label="quick"
              />
              Quick (인증 확인만)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`${name}-mode`}
                value="ping"
                checked={testMode === 'ping'}
                onChange={() => setTestMode('ping')}
                aria-label="ping"
              />
              Ping (모델 호출 테스트)
            </label>
          </div>
        </div>

        {/* ping 모드: 모델 체크박스 목록 */}
        {testMode === 'ping' && (
          <div className="space-y-2">
            <Label>테스트할 모델 선택</Label>
            <div className="grid grid-cols-2 gap-2">
              {modelOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={selectedModels.includes(opt.value)}
                    onCheckedChange={() =>
                      setSelectedModels(toggleModel(selectedModels, opt.value))
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Test 버튼 */}
        <Button
          onClick={handleTest}
          disabled={disabled}
          className="w-full"
          variant="outline"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              테스트 중...
            </>
          ) : (
            'Test'
          )}
        </Button>

        {/* 테스트 결과 표시 */}
        {testResult && <TestResultPanel result={testResult} />}
      </CardContent>
    </Card>
  )
}
