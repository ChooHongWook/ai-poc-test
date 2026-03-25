'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { createField, type SchemaField } from './schema-presets'

const FIELD_TYPES = [
  { value: 'string', label: '문자열' },
  { value: 'number', label: '숫자' },
  { value: 'boolean', label: '참/거짓' },
  { value: 'array', label: '배열' },
] as const

// 필드명 유효성 검사: 영문, 숫자, 언더스코어만 허용
const VALID_FIELD_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/

interface SchemaFieldBuilderProps {
  fields: SchemaField[]
  onChange: (fields: SchemaField[]) => void
}

export function SchemaFieldBuilder({
  fields,
  onChange,
}: SchemaFieldBuilderProps) {
  const updateField = (index: number, patch: Partial<SchemaField>) => {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f))
    onChange(next)
  }

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const addField = () => {
    onChange([...fields, createField()])
  }

  const isInvalidName = (name: string): boolean => {
    return name.length > 0 && !VALID_FIELD_NAME.test(name)
  }

  const isDuplicateName = (name: string, index: number): boolean => {
    if (!name.trim()) return false
    return fields.some((f, i) => i !== index && f.name.trim() === name.trim())
  }

  return (
    <div className="space-y-2">
      {fields.length > 0 && (
        <div className="text-muted-foreground mb-1 grid grid-cols-[auto_1fr_120px_1fr_auto_auto] items-center gap-2 text-xs">
          <span className="w-5" />
          <span>필드명</span>
          <span>타입</span>
          <span>설명</span>
          <span className="w-8 text-center">필수</span>
          <span className="w-8" />
        </div>
      )}

      {fields.map((field, index) => {
        const nameInvalid = isInvalidName(field.name)
        const nameDuplicate = isDuplicateName(field.name, index)

        return (
          <div key={field.id} className="space-y-1">
            <div className="group grid grid-cols-[auto_1fr_120px_1fr_auto_auto] items-center gap-2">
              <GripVertical className="text-muted-foreground/40 h-4 w-4" />

              <Input
                value={field.name}
                onChange={(e) => updateField(index, { name: e.target.value })}
                placeholder="field_name"
                className={`font-mono text-sm ${
                  nameInvalid || nameDuplicate ? 'border-destructive' : ''
                }`}
              />

              <Select
                value={field.type}
                onValueChange={(v) =>
                  updateField(index, { type: v as SchemaField['type'] })
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={field.description}
                onChange={(e) =>
                  updateField(index, { description: e.target.value })
                }
                placeholder="필드 설명"
                className="text-sm"
              />

              <div className="flex w-8 justify-center">
                <Checkbox
                  checked={field.isRequired}
                  onCheckedChange={(checked) =>
                    updateField(index, { isRequired: checked === true })
                  }
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-8 w-8"
                onClick={() => removeField(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {nameInvalid && (
              <p className="text-destructive pl-9 text-xs">
                영문, 숫자, 언더스코어만 사용 가능합니다 (첫 글자는 영문 또는
                언더스코어)
              </p>
            )}
            {nameDuplicate && (
              <p className="text-destructive pl-9 text-xs">
                중복된 필드명입니다
              </p>
            )}
          </div>
        )
      })}

      <Button variant="outline" size="sm" className="w-full" onClick={addField}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        필드 추가
      </Button>
    </div>
  )
}
