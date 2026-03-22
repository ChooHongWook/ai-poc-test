'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Database } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'
import { EmptyState } from '@/components/ui/empty-state'

interface InputDataSectionProps {
  inputFields: { id: string; label: string; value: string }[]
  onInputFieldsChange: (
    fields: { id: string; label: string; value: string }[],
  ) => void
}

export function InputDataSection({
  inputFields,
  onInputFieldsChange,
}: InputDataSectionProps) {
  const [newFieldLabel, setNewFieldLabel] = useState('')

  const addField = () => {
    if (newFieldLabel.trim()) {
      const newField = {
        id: Date.now().toString(),
        label: newFieldLabel,
        value: '',
      }
      onInputFieldsChange([...inputFields, newField])
      setNewFieldLabel('')
    }
  }

  const removeField = (id: string) => {
    onInputFieldsChange(inputFields.filter((field) => field.id !== id))
  }

  const updateFieldValue = (id: string, value: string) => {
    onInputFieldsChange(
      inputFields.map((field) =>
        field.id === id ? { ...field, value } : field,
      ),
    )
  }

  const getInputDataJSON = () => {
    const data: Record<string, string> = {}
    inputFields.forEach((field) => {
      data[field.label] = field.value
    })
    return JSON.stringify(data, null, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          입력 데이터
        </CardTitle>
        <CardDescription>
          문서 생성에 필요한 추가 데이터를 입력하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fields">필드 입력</TabsTrigger>
            <TabsTrigger value="json">JSON 보기</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="새 필드 이름 (예: 고객명, 날짜)"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addField()}
              />
              <Button onClick={addField} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {inputFields.length === 0 ? (
              <EmptyState>위에서 필드를 추가해주세요</EmptyState>
            ) : (
              <div className="space-y-3">
                {inputFields.map((field) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`input-${field.id}`}>{field.label}</Label>
                      <Input
                        id={`input-${field.id}`}
                        value={field.value}
                        onChange={(e) =>
                          updateFieldValue(field.id, e.target.value)
                        }
                        placeholder={`${field.label} 값을 입력하세요`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(field.id)}
                      className="mt-8"
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="json">
            <CodeBlock className="max-h-96 rounded-lg p-4">
              {getInputDataJSON()}
            </CodeBlock>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
