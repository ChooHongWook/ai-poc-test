'use client'

// AI 제공자 설정 카드 컴포넌트 - API Key 테스트 기능 포함
// @MX:NOTE: quick 모드(인증 확인만)와 ping 모드(실제 모델 호출) 지원
// @MX:NOTE: 모델 체크박스는 항상 표시 (모드와 무관)

import { useCallback, useEffect, useRef, useState } from 'react'
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
  MODEL_SOURCE_DOCS,
  BATCH_DOCS,
} from '@/lib/constants/ai-models'
import {
  isTestDisabled,
  toggleModel,
  addCustomModel,
  hasPendingJobs,
  toPollTargets,
  mergeBatchJobs,
} from '@/app/settings/_lib/test-key-ui'
import { TestResultPanel } from './TestResultPanel'
import { BatchResultPanel } from './BatchResultPanel'
import { SelectedModelsSummary } from './SelectedModelsSummary'
import type {
  TestKeyResponse,
  BatchStatusResponse,
  BatchJob,
  Provider,
} from '@/app/api/test-key/_validate'

// 배치 상태 자동 조회 주기
const POLL_INTERVAL_MS = 15_000

// 자동 조회 최대 시도 횟수 (15초 x 40 = 10분). 이후에는 수동 새로고침으로 전환
const MAX_POLL_ATTEMPTS = 40

interface ProviderCardProps {
  name: Provider
  label: string
}

/**
 * AI 제공자 설정 카드
 * - API Key 입력 및 활성화 토글
 * - quick/ping 모드 선택
 * - 모델 체크박스 목록 (항상 표시)
 * - 기타(커스텀) 모델 추가: 텍스트 입력 + 추가 버튼 (Enter 지원)
 * - 선택된 모델 요약 섹션: chip + × 제거
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
  const sourceDoc = MODEL_SOURCE_DOCS[name]
  const batchDoc = BATCH_DOCS[name]

  // 테스트 상태
  const [testMode, setTestMode] = useState<'quick' | 'ping' | 'batch'>('quick')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestKeyResponse | null>(null)

  // 배치 상태
  const [batchJobs, setBatchJobs] = useState<BatchJob[] | null>(null)
  const [polling, setPolling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pollingStopped, setPollingStopped] = useState(false)

  // 폴링 콜백이 최신 잡 목록을 읽되 interval을 재생성하지 않도록 ref로 보관
  const batchJobsRef = useRef<BatchJob[] | null>(null)
  const pollAttemptsRef = useRef(0)

  // 기타(커스텀) 모델 입력 상태
  const [customModelInput, setCustomModelInput] = useState('')

  // batch 모드는 모델 1개당 잡 1개를 만들므로 모델 미선택 시 실행 불가
  const disabled =
    isTestDisabled({
      enabled: state.enabled,
      apiKey: state.apiKey,
      loading,
    }) ||
    (testMode === 'batch' && selectedModels.length === 0)

  // 잡 목록을 state와 ref에 함께 반영
  function updateBatchJobs(jobs: BatchJob[] | null) {
    batchJobsRef.current = jobs
    setBatchJobs(jobs)
  }

  // 모드 전환 시 이전 모드의 결과와 폴링을 초기화
  function handleModeChange(mode: 'quick' | 'ping' | 'batch') {
    setTestMode(mode)
    setTestResult(null)
    setPolling(false)
    setPollingStopped(false)
    pollAttemptsRef.current = 0
    updateBatchJobs(null)
  }

  /**
   * 배치 잡 상태를 1회 조회하고 결과를 병합
   * 네트워크 오류는 다음 주기에 재시도하도록 조용히 무시한다
   */
  const refreshBatchStatus = useCallback(async () => {
    const jobs = batchJobsRef.current
    if (!jobs) return

    const targets = toPollTargets(jobs)
    if (targets.length === 0) {
      setPolling(false)
      return
    }

    setRefreshing(true)
    try {
      const response = await fetch('/api/test-key/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: name, apiKey: state.apiKey, jobs: targets }),
      })
      if (!response.ok) return

      const data = (await response.json()) as BatchStatusResponse
      const merged = mergeBatchJobs(batchJobsRef.current ?? [], data.jobs)
      updateBatchJobs(merged)

      if (!hasPendingJobs(merged)) {
        setPolling(false)
        setPollingStopped(false)
      }
    } catch {
      // 폴링 중 일시적 오류는 다음 주기에 재시도
    } finally {
      setRefreshing(false)
    }
  }, [name, state.apiKey])

  // 자동 조회 타이머 - polling이 true인 동안만 동작하며 unmount 시 정리됨
  useEffect(() => {
    if (!polling) return

    const timer = setInterval(() => {
      pollAttemptsRef.current += 1
      if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        setPolling(false)
        setPollingStopped(true)
        return
      }
      void refreshBatchStatus()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [polling, refreshBatchStatus])

  // 커스텀 모델 추가 핸들러
  function handleAddCustomModel() {
    const next = addCustomModel(selectedModels, customModelInput)
    setSelectedModels(next)
    setCustomModelInput('')
  }

  // Enter 키 핸들러
  function handleCustomInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustomModel()
    }
  }

  // 테스트 버튼 핸들러
  async function handleTest() {
    if (disabled) return
    setLoading(true)
    setTestResult(null)
    setPolling(false)
    setPollingStopped(false)
    pollAttemptsRef.current = 0
    updateBatchJobs(null)

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

      if (!data.keyValid) {
        toast.error(`${label} API Key 검증 실패: ${data.keyError ?? '알 수 없는 오류'}`)
        return
      }

      toast.success(`${label} API Key 검증 성공`)

      // batch 모드: 제출된 잡을 저장하고 자동 조회 시작
      if (data.batchJobs) {
        updateBatchJobs(data.batchJobs)
        const pending = hasPendingJobs(data.batchJobs)
        setPolling(pending)
        if (pending) {
          toast.info('배치 잡을 제출했습니다. 15초마다 상태를 조회합니다.')
        }
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
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`${name}-mode`}
                value="quick"
                checked={testMode === 'quick'}
                onChange={() => handleModeChange('quick')}
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
                onChange={() => handleModeChange('ping')}
                aria-label="ping"
              />
              Ping (모델 호출 테스트)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`${name}-mode`}
                value="batch"
                checked={testMode === 'batch'}
                onChange={() => handleModeChange('batch')}
                aria-label="batch"
              />
              Batch (배치 API 테스트)
            </label>
          </div>
          {testMode === 'batch' && (
            <p
              className="text-xs text-destructive"
              data-testid={`${name}-batch-warning`}
            >
              배치 잡은 제출 즉시 실제 처리·과금이 발생하며, 완료까지 최대 24시간이
              걸릴 수 있습니다. 모델 1개당 잡 1개가 생성됩니다.
            </p>
          )}
        </div>

        {/* 모델 체크박스 목록 - 항상 표시 (모드와 무관) */}
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
          {/* 모델 목록 출처 공식 문서 링크 */}
          <p className="text-xs text-muted-foreground">
            모델 목록 출처:{' '}
            <a
              href={sourceDoc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {sourceDoc.label}
            </a>
          </p>
          {/* 배치(Batch) 처리·요금 공식 문서 링크 */}
          <p className="text-xs text-muted-foreground">
            배치(Batch) 문서:{' '}
            <a
              href={batchDoc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {batchDoc.label}
            </a>
          </p>
        </div>

        {/* 기타(커스텀) 모델 추가 */}
        <div className="space-y-2">
          <Label>기타 모델 직접 추가</Label>
          <div className="flex gap-2">
            <Input
              placeholder="모델 ID를 직접 입력하세요"
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
              onKeyDown={handleCustomInputKeyDown}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCustomModel}
            >
              추가
            </Button>
          </div>
        </div>

        {/* 선택된 모델 요약 (빌트인 + 커스텀) */}
        <SelectedModelsSummary
          selected={selectedModels}
          options={modelOptions}
          onRemove={(value) =>
            setSelectedModels(toggleModel(selectedModels, value))
          }
        />

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

        {/* 배치 잡 상태 표시 */}
        {batchJobs && batchJobs.length > 0 && (
          <BatchResultPanel
            jobs={batchJobs}
            polling={polling}
            refreshing={refreshing}
            pollingStopped={pollingStopped}
            onRefresh={() => void refreshBatchStatus()}
          />
        )}
      </CardContent>
    </Card>
  )
}
