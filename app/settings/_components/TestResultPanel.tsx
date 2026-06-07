'use client'

// API Key 테스트 결과 표시 패널 컴포넌트
import { Badge } from '@/components/ui/badge'
import { badgeVariant } from '@/app/settings/_lib/test-key-ui'
import type { ModelTestResult, TestKeyResponse } from '@/app/api/test-key/_validate'

interface TestResultPanelProps {
  result: TestKeyResponse
}

/**
 * API Key 테스트 결과를 표시하는 패널
 * - 키 유효성 Badge
 * - ping 모드: 모델별 결과 행 (상태, 지연시간, 미리보기, 에러)
 */
export function TestResultPanel({ result }: TestResultPanelProps) {
  return (
    <div className="mt-4 space-y-3" data-testid="test-result-panel">
      {/* 키 유효성 표시 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">키 상태:</span>
        <Badge variant={badgeVariant(result.keyValid)}>
          {result.keyValid ? '유효' : '무효'}
        </Badge>
        {result.keyError && (
          <span className="text-sm text-muted-foreground">{result.keyError}</span>
        )}
      </div>

      {/* ping 모드: 모델별 결과 표시 */}
      {result.results && result.results.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium">모델 테스트 결과:</span>
          {result.results.map((modelResult: ModelTestResult) => (
            <ModelResultRow key={modelResult.model} result={modelResult} />
          ))}
        </div>
      )}
    </div>
  )
}

// 단일 모델 결과 행 컴포넌트
function ModelResultRow({ result }: { result: ModelTestResult }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-md border p-2"
      data-testid={`model-result-${result.model}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{result.model}</span>
        <Badge variant={badgeVariant(result.success)}>
          {result.success ? '성공' : '실패'}
        </Badge>
        <span className="text-xs text-muted-foreground">{result.latencyMs}ms</span>
      </div>
      {result.preview && (
        <p className="text-xs text-muted-foreground">{result.preview}</p>
      )}
      {result.error && (
        <p className="text-xs text-destructive">{result.error}</p>
      )}
    </div>
  )
}
