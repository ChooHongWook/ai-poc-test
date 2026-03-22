'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'

export interface ModelOption {
  value: string
  label: string
}

interface AIProviderConfigItemProps {
  id: string
  label: string
  iconColor: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  model: string
  onModelChange: (value: string) => void
  modelOptions: ModelOption[]
  apiKey: string
  onApiKeyChange: (value: string) => void
  apiKeyPlaceholder?: string
}

export function AIProviderConfigItem({
  id,
  label,
  iconColor,
  checked,
  onCheckedChange,
  model,
  onModelChange,
  modelOptions,
  apiKey,
  onApiKeyChange,
  apiKeyPlaceholder = 'API Key를 입력하세요',
}: AIProviderConfigItemProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Checkbox
          id={`${id}-enabled`}
          checked={checked}
          onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
        />
        <div className="flex items-center gap-2">
          <Bot className={cn('h-5 w-5', iconColor)} />
          <Label
            htmlFor={`${id}-enabled`}
            className={cn(
              // 타이포그래피
              'text-base font-semibold',
              // 인터랙션
              'cursor-pointer',
            )}
          >
            {label}
          </Label>
        </div>
      </div>

      {checked && (
        <div
          className={cn(
            // 레이아웃/간격
            'ml-8 space-y-3',
            // 크기/간격
            'rounded-lg p-4',
            // 색상/배경
            'bg-muted/30 border',
          )}
        >
          <div className="space-y-2">
            <Label htmlFor={`${id}-model`}>모델 선택</Label>
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger id={`${id}-model`}>
                <SelectValue placeholder="모델을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-key`}>API Key</Label>
            <Input
              id={`${id}-key`}
              type="password"
              placeholder={apiKeyPlaceholder}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
