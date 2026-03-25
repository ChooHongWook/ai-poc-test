'use client'

import { useState, useMemo, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code, AlertCircle, CheckCircle2, Layers } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { jsonSchemaToZod } from '@/lib/langchain/schema-converter'
import { SchemaFieldBuilder } from './_schema/SchemaFieldBuilder'
import {
  SCHEMA_PRESETS,
  fieldsToJsonSchema,
  jsonSchemaToFields,
  type SchemaField,
} from './_schema/schema-presets'

interface SchemaSectionProps {
  value: string
  onChange: (value: string) => void
}

type SchemaValidation =
  | { status: 'empty' }
  | { status: 'invalid-json' }
  | { status: 'invalid-schema'; errorMessage: string }
  | { status: 'valid'; fields: string[] }

function validateSchema(value: string): SchemaValidation {
  if (!value.trim()) {
    return { status: 'empty' }
  }

  try {
    jsonSchemaToZod(value) // Zod 변환 가능 여부 검증 (throw 시 실패)

    const parsed = JSON.parse(value) as Record<string, unknown>
    const properties = (parsed.properties ?? {}) as Record<string, unknown>
    return { status: 'valid', fields: Object.keys(properties) }
  } catch (e) {
    // JSON 파싱 실패와 스키마 변환 실패를 구분
    try {
      JSON.parse(value)
      return {
        status: 'invalid-schema',
        errorMessage:
          e instanceof Error ? e.message : '스키마 변환에 실패했습니다',
      }
    } catch {
      return { status: 'invalid-json' }
    }
  }
}

export function SchemaSection({ value, onChange }: SchemaSectionProps) {
  const [activeTab, setActiveTab] = useState<string>('builder')
  const validation = useMemo(() => validateSchema(value), [value])

  // JSON → 빌더 필드 동기화
  const builderFields = useMemo<SchemaField[]>(() => {
    return jsonSchemaToFields(value) ?? []
  }, [value])

  const handleFieldsChange = useCallback(
    (fields: SchemaField[]) => {
      onChange(fieldsToJsonSchema(fields))
    },
    [onChange],
  )

  const handlePresetSelect = useCallback(
    (presetId: string) => {
      const preset = SCHEMA_PRESETS.find((p) => p.id === presetId)
      if (preset) {
        onChange(fieldsToJsonSchema(preset.fields))
      }
    },
    [onChange],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          AI 스키마
        </CardTitle>
        <CardDescription>출력 데이터의 구조를 정의하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 프리셋 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            프리셋
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {SCHEMA_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePresetSelect(preset.id)}
                title={preset.description}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 탭: 빌더 / JSON */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="builder">빌더</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-3">
            <SchemaFieldBuilder
              fields={builderFields}
              onChange={handleFieldsChange}
            />
          </TabsContent>

          <TabsContent value="json" className="mt-3">
            <div className="space-y-2">
              <Label htmlFor="schema">JSON Schema</Label>
              <Textarea
                id="schema"
                placeholder={`{\n  "type": "object",\n  "properties": {\n    "title": { "type": "string" },\n    "content": { "type": "string" },\n    "summary": { "type": "string" }\n  }\n}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* 검증 결과 */}
        {validation.status === 'invalid-json' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              유효하지 않은 JSON 형식입니다. 구문을 확인해주세요.
            </AlertDescription>
          </Alert>
        )}

        {validation.status === 'valid' && (
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Zod 스키마 변환 가능</span>
              <Badge variant="secondary">
                {validation.fields.length}개 필드
              </Badge>
            </div>
            {validation.fields.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {validation.fields.map((field) => (
                  <Badge
                    key={field}
                    variant="outline"
                    className="font-mono text-xs"
                  >
                    {field}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {validation.status === 'invalid-schema' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              JSON은 유효하지만 Zod 스키마로 변환할 수 없습니다.{' '}
              {validation.errorMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
