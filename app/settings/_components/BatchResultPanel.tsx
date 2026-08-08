'use client'

// 배치 잡 상태·결과 표시 패널 컴포넌트
// @MX:NOTE: 배치는 비동기라 제출 직후에는 모든 잡이 pending 상태로 표시됨

import { Loader2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  batchBadgeVariant,
  batchStatusLabel,
  formatClockTime,
  formatDuration,
} from '@/app/settings/_lib/test-key-ui'
import type { BatchJob } from '@/app/api/test-key/_validate'

interface BatchResultPanelProps {
  jobs: BatchJob[]
  polling: boolean
  refreshing: boolean
  pollingStopped: boolean
  onRefresh: () => void
}

/**
 * 배치 테스트 결과 패널
 * - 잡별 상태 Badge, jobId, 응답 미리보기, 에러
 * - 폴링 진행 상태 표시 및 수동 새로고침
 */
export function BatchResultPanel({
  jobs,
  polling,
  refreshing,
  pollingStopped,
  onRefresh,
}: BatchResultPanelProps) {
  return (
    <div className="mt-4 space-y-3" data-testid="batch-result-panel">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">배치 잡 상태:</span>
        <div className="flex items-center gap-2">
          {polling && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              자동 조회 중
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            상태 새로고침
          </Button>
        </div>
      </div>

      {pollingStopped && (
        <p className="text-xs text-muted-foreground">
          자동 조회를 중단했습니다. 배치는 최대 24시간까지 걸릴 수 있으니 상태
          새로고침 버튼으로 확인하세요.
        </p>
      )}

      <div className="space-y-2">
        {jobs.map((job) => (
          <BatchJobRow key={job.model} job={job} />
        ))}
      </div>
    </div>
  )
}

// 단일 배치 잡 행 컴포넌트
function BatchJobRow({ job }: { job: BatchJob }) {
  const submittedAt = formatClockTime(job.submittedAt)
  const completedAt = formatClockTime(job.completedAt)
  const duration = formatDuration(job.submittedAt, job.completedAt)

  return (
    <div
      className="flex flex-col gap-1 rounded-md border p-2"
      data-testid={`batch-job-${job.model}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{job.model}</span>
        <Badge variant={batchBadgeVariant(job.status)}>
          {batchStatusLabel(job.status)}
        </Badge>
        {job.rawStatus && (
          <span className="text-xs text-muted-foreground">{job.rawStatus}</span>
        )}
      </div>

      {/* 전송/수신 시각 - title에 전체 ISO 값을 담아 날짜까지 확인 가능 */}
      {(submittedAt || completedAt) && (
        <div
          className="flex flex-wrap gap-x-3 text-xs text-muted-foreground"
          data-testid={`batch-time-${job.model}`}
        >
          {submittedAt && <span title={job.submittedAt}>전송 {submittedAt}</span>}
          {completedAt ? (
            <span title={job.completedAt}>수신 {completedAt}</span>
          ) : (
            <span>수신 대기 중</span>
          )}
          {duration && <span>소요 {duration}</span>}
        </div>
      )}

      {job.jobId && (
        <p className="font-mono text-xs text-muted-foreground break-all">
          {job.jobId}
        </p>
      )}
      {job.preview && (
        <p className="text-xs text-muted-foreground">{job.preview}</p>
      )}
      {job.error && <p className="text-xs text-destructive">{job.error}</p>}
    </div>
  )
}
