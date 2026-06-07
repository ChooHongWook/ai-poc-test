// TASK-005: test-key-ui.ts 순수 헬퍼 함수 테스트 (RED 페이즈)
import { describe, expect, it } from 'vitest'
import {
  isTestDisabled,
  badgeVariant,
  toggleModel,
} from '../_lib/test-key-ui'

describe('isTestDisabled', () => {
  it('enabled=false 이면 true 를 반환한다', () => {
    expect(isTestDisabled({ enabled: false, apiKey: 'sk-key', loading: false })).toBe(true)
  })

  it('apiKey 가 비어 있으면 true 를 반환한다', () => {
    expect(isTestDisabled({ enabled: true, apiKey: '', loading: false })).toBe(true)
  })

  it('loading=true 이면 true 를 반환한다', () => {
    expect(isTestDisabled({ enabled: true, apiKey: 'sk-key', loading: true })).toBe(true)
  })

  it('enabled=true, apiKey 있음, loading=false 이면 false 를 반환한다', () => {
    expect(isTestDisabled({ enabled: true, apiKey: 'sk-key', loading: false })).toBe(false)
  })

  it('apiKey 가 공백만 있으면 true 를 반환한다', () => {
    expect(isTestDisabled({ enabled: true, apiKey: '   ', loading: false })).toBe(true)
  })
})

describe('badgeVariant', () => {
  it('success=true 이면 "default" 를 반환한다', () => {
    expect(badgeVariant(true)).toBe('default')
  })

  it('success=false 이면 "destructive" 를 반환한다', () => {
    expect(badgeVariant(false)).toBe('destructive')
  })
})

describe('toggleModel', () => {
  it('모델이 없으면 추가한다', () => {
    const result = toggleModel([], 'gpt-4o')
    expect(result).toContain('gpt-4o')
    expect(result).toHaveLength(1)
  })

  it('모델이 이미 있으면 제거한다', () => {
    const result = toggleModel(['gpt-4o', 'gpt-4o-mini'], 'gpt-4o')
    expect(result).not.toContain('gpt-4o')
    expect(result).toContain('gpt-4o-mini')
  })

  it('기존 목록을 변경하지 않는다 (불변성)', () => {
    const original = ['gpt-4o']
    const result = toggleModel(original, 'gpt-4o-mini')
    expect(original).toHaveLength(1)
    expect(result).toHaveLength(2)
  })

  it('빈 목록에서 제거 시 빈 목록을 반환한다', () => {
    const result = toggleModel([], 'gpt-4o')
    expect(result).toHaveLength(1)
  })

  it('여러 모델이 있는 목록에서 추가한다', () => {
    const result = toggleModel(['gpt-4o', 'gpt-4o-mini'], 'o3-mini')
    expect(result).toHaveLength(3)
    expect(result).toContain('o3-mini')
  })
})
