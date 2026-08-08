// 설정 페이지 API Key 테스트 UI를 위한 순수 헬퍼 함수
// 외부 의존성 없음 - node 환경에서 테스트 가능
import type { ModelOption } from '@/lib/constants/ai-models'
import type { BatchJob } from '@/app/api/test-key/_validate'

/**
 * 테스트 버튼 비활성화 여부를 판별
 * - enabled=false: 제공자 비활성화
 * - apiKey 없음 또는 공백: 키 미입력
 * - loading=true: 이미 테스트 진행 중
 */
export function isTestDisabled({
  enabled,
  apiKey,
  loading,
}: {
  enabled: boolean
  apiKey: string
  loading: boolean
}): boolean {
  return !enabled || !apiKey.trim() || loading
}

/**
 * 성공 여부에 따라 shadcn Badge 변형 반환
 * - success=true: 'default' (초록/기본)
 * - success=false: 'destructive' (빨강)
 */
export function badgeVariant(success: boolean): 'default' | 'destructive' {
  return success ? 'default' : 'destructive'
}

/**
 * 모델 체크박스 토글 리듀서 (불변)
 * - 모델이 목록에 없으면 추가
 * - 모델이 이미 있으면 제거
 */
export function toggleModel(models: string[], model: string): string[] {
  if (models.includes(model)) {
    return models.filter((m) => m !== model)
  }
  return [...models, model]
}

/**
 * 커스텀 모델을 목록에 추가 (불변)
 * - raw를 trim한 뒤 빈 문자열이면 무시
 * - 이미 존재하는 모델이면 중복 추가 없이 원본 반환
 * - 그 외에는 목록 끝에 추가
 */
export function addCustomModel(models: string[], raw: string): string[] {
  const trimmed = raw.trim()
  if (!trimmed) return models
  if (models.includes(trimmed)) return models
  return [...models, trimmed]
}

/**
 * 빌트인 모델 옵션 목록에서 value에 해당하는 label 반환
 * - 빌트인 옵션에 있으면 label 반환
 * - 없으면 value 자체를 반환 (커스텀 모델 ID)
 */
export function getModelLabel(options: ModelOption[], value: string): string {
  const found = options.find((opt) => opt.value === value)
  return found ? found.label : value
}

// ── 배치(Batch) 폴링 헬퍼 ─────────────────────────────────

/**
 * 폴링을 계속해야 하는 잡이 남아 있는지 판별
 * jobId가 없는 잡(제출 실패)은 조회 대상이 아니므로 제외
 */
export function hasPendingJobs(jobs: BatchJob[]): boolean {
  return jobs.some((job) => job.status === 'pending' && job.jobId !== null)
}

/**
 * 폴링 대상 잡 목록을 조회 요청 형태로 추출
 * pending이면서 jobId가 있는 잡만 대상
 */
export function toPollTargets(jobs: BatchJob[]): { model: string; jobId: string }[] {
  return jobs
    .filter((job): job is BatchJob & { jobId: string } =>
      job.status === 'pending' && job.jobId !== null,
    )
    .map((job) => ({ model: job.model, jobId: job.jobId }))
}

/**
 * 폴링 응답을 기존 잡 목록에 병합 (불변)
 * - model을 키로 매칭하며, 응답에 없는 잡은 기존 상태를 유지
 * - 목록의 순서와 길이는 기존 목록을 그대로 따름
 * - submittedAt은 제출 시점에만 알 수 있고 폴링 요청은 jobId만 보내므로,
 *   응답이 값을 주지 않으면 기존 값을 유지해 유실을 막는다
 */
export function mergeBatchJobs(current: BatchJob[], incoming: BatchJob[]): BatchJob[] {
  const incomingByModel = new Map(incoming.map((job) => [job.model, job]))
  return current.map((job) => {
    const next = incomingByModel.get(job.model)
    if (!next) return job
    return { ...next, submittedAt: next.submittedAt ?? job.submittedAt }
  })
}

/**
 * ISO 8601 문자열을 로컬 시각 HH:MM:SS로 포맷
 * 값이 없거나 파싱 불가하면 null
 */
export function formatClockTime(iso: string | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/**
 * 제출~완료 사이 소요 시간을 한국어 문자열로 포맷
 * 두 시각 중 하나라도 없거나 종료가 시작보다 앞서면 null
 */
export function formatDuration(
  startIso: string | undefined,
  endIso: string | undefined,
): string | null {
  if (!startIso || !endIso) return null
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null

  const totalSeconds = Math.round((end - start) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}시간 ${minutes}분 ${seconds}초`
  if (minutes > 0) return `${minutes}분 ${seconds}초`
  return `${seconds}초`
}

/**
 * 배치 잡 상태에 대응하는 shadcn Badge 변형 반환
 * pending은 진행 중이므로 성공/실패와 구분되는 'secondary'
 */
export function batchBadgeVariant(
  status: BatchJob['status'],
): 'default' | 'destructive' | 'secondary' {
  if (status === 'succeeded') return 'default'
  if (status === 'failed') return 'destructive'
  return 'secondary'
}

/** 배치 잡 상태의 한국어 표시 문자열 */
export function batchStatusLabel(status: BatchJob['status']): string {
  if (status === 'succeeded') return '완료'
  if (status === 'failed') return '실패'
  return '진행 중'
}
