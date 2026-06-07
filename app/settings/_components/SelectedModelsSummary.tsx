'use client'

// 선택된 모델 요약 섹션 - 빌트인 + 커스텀 모델을 chip으로 표시
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ModelOption } from '@/lib/constants/ai-models'
import { getModelLabel } from '@/app/settings/_lib/test-key-ui'

interface SelectedModelsSummaryProps {
  /** 현재 선택된 모델 value 배열 (빌트인 + 커스텀 혼용) */
  selected: string[]
  /** 빌트인 모델 옵션 배열 (label 조회에 사용) */
  options: ModelOption[]
  /** chip의 × 버튼 클릭 시 호출 */
  onRemove: (value: string) => void
}

/**
 * 선택된 모델 목록을 chip 형태로 요약 표시하는 컴포넌트
 * - 빌트인 모델: options에서 label 조회
 * - 커스텀 모델: value(ID) 그대로 표시
 * - 각 chip에 × 제거 버튼 포함
 * - 선택 없으면 "선택된 모델 없음" 안내 문구
 */
export function SelectedModelsSummary({
  selected,
  options,
  onRemove,
}: SelectedModelsSummaryProps) {
  return (
    <div className="space-y-2" data-testid="selected-models-summary">
      <p className="text-sm font-medium text-muted-foreground">
        선택된 모델 ({selected.length})
      </p>
      {selected.length === 0 ? (
        <p className="text-sm text-muted-foreground">선택된 모델 없음</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selected.map((value) => {
            const displayLabel = getModelLabel(options, value)
            return (
              <Badge
                key={value}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span>{displayLabel}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  aria-label={`${displayLabel} 제거`}
                  onClick={() => onRemove(value)}
                >
                  ×
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
