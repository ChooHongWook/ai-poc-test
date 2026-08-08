// 배치 폴링 순수 헬퍼 함수 테스트
import { describe, expect, it } from 'vitest'
import {
  hasPendingJobs,
  toPollTargets,
  mergeBatchJobs,
  batchBadgeVariant,
  batchStatusLabel,
  formatClockTime,
  formatDuration,
} from '../_lib/test-key-ui'
import type { BatchJob } from '@/app/api/test-key/_validate'

const pendingJob: BatchJob = {
  model: 'gpt-5.4-mini',
  jobId: 'batch_1',
  status: 'pending',
  rawStatus: 'in_progress',
}
const succeededJob: BatchJob = {
  model: 'gpt-5.4',
  jobId: 'batch_2',
  status: 'succeeded',
  preview: 'Hello!',
}
const submitFailedJob: BatchJob = {
  model: 'gpt-5.5',
  jobId: null,
  status: 'failed',
  error: '배치 제출 중 오류가 발생했습니다.',
}

describe('hasPendingJobs', () => {
  it('pending 이면서 jobId 가 있는 잡이 있으면 true 를 반환한다', () => {
    expect(hasPendingJobs([succeededJob, pendingJob])).toBe(true)
  })

  it('모든 잡이 종료 상태면 false 를 반환한다', () => {
    expect(hasPendingJobs([succeededJob, submitFailedJob])).toBe(false)
  })

  it('빈 목록이면 false 를 반환한다', () => {
    expect(hasPendingJobs([])).toBe(false)
  })

  it('jobId 가 없는 pending 잡은 폴링 대상으로 세지 않는다', () => {
    const orphan: BatchJob = { model: 'x', jobId: null, status: 'pending' }
    expect(hasPendingJobs([orphan])).toBe(false)
  })
})

describe('toPollTargets', () => {
  it('pending 이면서 jobId 가 있는 잡만 추출한다', () => {
    expect(toPollTargets([pendingJob, succeededJob, submitFailedJob])).toEqual([
      { model: 'gpt-5.4-mini', jobId: 'batch_1' },
    ])
  })

  it('대상이 없으면 빈 배열을 반환한다', () => {
    expect(toPollTargets([succeededJob])).toEqual([])
  })
})

describe('mergeBatchJobs', () => {
  it('응답에 포함된 잡은 새 상태로 교체한다', () => {
    const incoming: BatchJob[] = [
      { model: 'gpt-5.4-mini', jobId: 'batch_1', status: 'succeeded', preview: 'Hi' },
    ]
    const merged = mergeBatchJobs([pendingJob, succeededJob], incoming)
    expect(merged[0]?.status).toBe('succeeded')
    expect(merged[0]?.preview).toBe('Hi')
  })

  it('응답에 없는 잡은 기존 상태를 유지한다', () => {
    const merged = mergeBatchJobs([pendingJob, succeededJob], [])
    expect(merged).toEqual([pendingJob, succeededJob])
  })

  it('원본 배열을 변경하지 않는다', () => {
    const current = [pendingJob]
    const incoming: BatchJob[] = [
      { model: 'gpt-5.4-mini', jobId: 'batch_1', status: 'failed', error: 'x' },
    ]
    mergeBatchJobs(current, incoming)
    expect(current[0]?.status).toBe('pending')
  })

  it('순서와 길이는 기존 목록을 따른다', () => {
    const incoming: BatchJob[] = [
      { model: 'unknown-model', jobId: 'batch_9', status: 'succeeded' },
    ]
    const merged = mergeBatchJobs([pendingJob, succeededJob], incoming)
    expect(merged).toHaveLength(2)
    expect(merged.map((j) => j.model)).toEqual(['gpt-5.4-mini', 'gpt-5.4'])
  })
})

describe('mergeBatchJobs - submittedAt 보존', () => {
  it('응답에 submittedAt 이 없으면 기존 값을 유지한다', () => {
    const current: BatchJob[] = [
      { ...pendingJob, submittedAt: '2026-08-08T01:00:00.000Z' },
    ]
    const incoming: BatchJob[] = [
      { model: 'gpt-5.4-mini', jobId: 'batch_1', status: 'succeeded', preview: 'Hi' },
    ]

    const merged = mergeBatchJobs(current, incoming)

    expect(merged[0]?.submittedAt).toBe('2026-08-08T01:00:00.000Z')
    expect(merged[0]?.status).toBe('succeeded')
  })

  it('응답에 submittedAt 이 있으면 provider 값으로 교체한다', () => {
    const current: BatchJob[] = [
      { ...pendingJob, submittedAt: '2026-08-08T01:00:00.000Z' },
    ]
    const incoming: BatchJob[] = [
      {
        model: 'gpt-5.4-mini',
        jobId: 'batch_1',
        status: 'succeeded',
        submittedAt: '2026-08-08T00:59:58.000Z',
        completedAt: '2026-08-08T01:05:00.000Z',
      },
    ]

    const merged = mergeBatchJobs(current, incoming)

    expect(merged[0]?.submittedAt).toBe('2026-08-08T00:59:58.000Z')
    expect(merged[0]?.completedAt).toBe('2026-08-08T01:05:00.000Z')
  })
})

describe('formatClockTime', () => {
  it('ISO 문자열을 로컬 HH:MM:SS 로 포맷한다', () => {
    // 로컬 시각으로 Date 를 만들어 타임존과 무관하게 검증
    const iso = new Date(2026, 7, 8, 13, 5, 9).toISOString()
    expect(formatClockTime(iso)).toBe('13:05:09')
  })

  it('한 자리 수를 0으로 채운다', () => {
    const iso = new Date(2026, 7, 8, 3, 4, 5).toISOString()
    expect(formatClockTime(iso)).toBe('03:04:05')
  })

  it('값이 없으면 null 을 반환한다', () => {
    expect(formatClockTime(undefined)).toBeNull()
  })

  it('파싱 불가한 값이면 null 을 반환한다', () => {
    expect(formatClockTime('not-a-date')).toBeNull()
  })
})

describe('formatDuration', () => {
  const base = '2026-08-08T01:00:00.000Z'

  it('1분 미만은 초 단위로 표시한다', () => {
    expect(formatDuration(base, '2026-08-08T01:00:42.000Z')).toBe('42초')
  })

  it('1시간 미만은 분과 초로 표시한다', () => {
    expect(formatDuration(base, '2026-08-08T01:03:07.000Z')).toBe('3분 7초')
  })

  it('1시간 이상은 시간·분·초로 표시한다', () => {
    expect(formatDuration(base, '2026-08-08T02:10:05.000Z')).toBe('1시간 10분 5초')
  })

  it('완료 시각이 없으면 null 을 반환한다', () => {
    expect(formatDuration(base, undefined)).toBeNull()
  })

  it('완료가 제출보다 앞서면 null 을 반환한다', () => {
    expect(formatDuration(base, '2026-08-08T00:59:00.000Z')).toBeNull()
  })
})

describe('batchBadgeVariant / batchStatusLabel', () => {
  it.each([
    ['succeeded', 'default', '완료'],
    ['failed', 'destructive', '실패'],
    ['pending', 'secondary', '진행 중'],
  ] as const)('%s 상태를 %s / %s 로 표시한다', (status, variant, label) => {
    expect(batchBadgeVariant(status)).toBe(variant)
    expect(batchStatusLabel(status)).toBe(label)
  })
})
