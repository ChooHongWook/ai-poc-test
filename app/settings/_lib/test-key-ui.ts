// 설정 페이지 API Key 테스트 UI를 위한 순수 헬퍼 함수
// 외부 의존성 없음 - node 환경에서 테스트 가능

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
