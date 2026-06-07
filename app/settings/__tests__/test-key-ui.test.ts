// TASK-005: test-key-ui.ts 순수 헬퍼 함수 테스트 (RED 페이즈)
import { describe, expect, it } from 'vitest'
import {
  isTestDisabled,
  badgeVariant,
  toggleModel,
  addCustomModel,
  getModelLabel,
} from '../_lib/test-key-ui'
import type { ModelOption } from '@/lib/constants/ai-models'

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

// RED: addCustomModel 함수 테스트
describe('addCustomModel', () => {
  it('새 모델을 목록에 추가한다', () => {
    const result = addCustomModel([], 'my-custom-model')
    expect(result).toContain('my-custom-model')
    expect(result).toHaveLength(1)
  })

  it('앞뒤 공백을 제거한 후 추가한다', () => {
    const result = addCustomModel([], '  my-model  ')
    expect(result).toContain('my-model')
    expect(result[0]).toBe('my-model')
  })

  it('빈 문자열은 무시한다', () => {
    const result = addCustomModel(['existing'], '')
    expect(result).toHaveLength(1)
    expect(result).toContain('existing')
  })

  it('공백만 있는 문자열은 무시한다', () => {
    const result = addCustomModel(['existing'], '   ')
    expect(result).toHaveLength(1)
    expect(result).toContain('existing')
  })

  it('이미 존재하는 모델은 중복 추가하지 않는다', () => {
    const result = addCustomModel(['my-model'], 'my-model')
    expect(result).toHaveLength(1)
  })

  it('공백 trim 후 중복이면 무시한다', () => {
    const result = addCustomModel(['my-model'], '  my-model  ')
    expect(result).toHaveLength(1)
  })

  it('기존 목록을 변경하지 않는다 (불변성)', () => {
    const original = ['existing']
    const result = addCustomModel(original, 'new-model')
    expect(original).toHaveLength(1)
    expect(result).toHaveLength(2)
  })
})

// RED: getModelLabel 함수 테스트
describe('getModelLabel', () => {
  const options: ModelOption[] = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  ]

  it('빌트인 옵션이면 해당 label을 반환한다', () => {
    expect(getModelLabel(options, 'gpt-4o')).toBe('GPT-4o')
  })

  it('다른 빌트인 옵션의 label을 반환한다', () => {
    expect(getModelLabel(options, 'gpt-4o-mini')).toBe('GPT-4o Mini')
  })

  it('커스텀 모델(빌트인에 없는)이면 value 자체를 반환한다', () => {
    expect(getModelLabel(options, 'my-custom-model')).toBe('my-custom-model')
  })

  it('빈 options 배열에서 커스텀 모델이면 value를 반환한다', () => {
    expect(getModelLabel([], 'custom')).toBe('custom')
  })
})
