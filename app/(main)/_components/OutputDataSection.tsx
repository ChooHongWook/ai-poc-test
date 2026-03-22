'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileOutput, CheckCircle2, Bot, History, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CodeBlock } from '@/components/ui/code-block'
import { EmptyState } from '@/components/ui/empty-state'
import { AIOutputPreview } from '@/app/(main)/_components/AIOutputPreview'
import { useState } from 'react'
import type { AIOutput, HistoryItem } from '@/lib/types'

interface OutputDataSectionProps {
  chatgptOutput: AIOutput
  geminiOutput: AIOutput
  claudeOutput: AIOutput
  enabledProviders: {
    chatgpt: boolean
    gemini: boolean
    claude: boolean
  }
  history: HistoryItem[]
}

interface SingleOutputCardProps {
  title: string
  icon: React.ReactNode
  output: AIOutput
  enabled: boolean
  color: string
}

const borderColorMap: Record<string, string> = {
  green: 'border-green-200',
  blue: 'border-blue-200',
  purple: 'border-purple-200',
}

function SingleOutputCard({
  title,
  icon,
  output,
  enabled,
  color,
}: SingleOutputCardProps) {
  const getOutputDataJSON = (data: Record<string, string>) => {
    return JSON.stringify(data, null, 2)
  }

  const outputKeys = Object.keys(output.data)

  if (!enabled) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
            <Badge variant="secondary" className="ml-auto">
              비활성화
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Bot className="h-12 w-12 opacity-50" />}
            className="py-12"
          >
            <p>{title}가 비활성화되어 있습니다</p>
          </EmptyState>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={borderColorMap[color]}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
          {output.generated && (
            <Badge variant="default" className="ml-auto">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              생성 완료
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{title} 모델의 출력 결과</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fields">필드 보기</TabsTrigger>
            <TabsTrigger value="json">JSON 보기</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="space-y-4">
            {!output.generated || outputKeys.length === 0 ? (
              <EmptyState
                icon={<FileOutput className="h-12 w-12 opacity-50" />}
                className="py-12"
              >
                <p>{title} 결과를 기다리는 중입니다</p>
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {outputKeys.map((key) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`output-${title}-${key}`}>{key}</Label>
                    <Input
                      id={`output-${title}-${key}`}
                      value={output.data[key]}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="json">
            {!output.generated || outputKeys.length === 0 ? (
              <div
                className={cn(
                  // 크기/간격
                  'rounded-lg p-4 py-12',
                  // 색상/배경
                  'bg-muted text-muted-foreground',
                  // 레이아웃
                  'text-center',
                )}
              >
                결과가 없습니다
              </div>
            ) : (
              <CodeBlock className="max-h-96 rounded-lg p-4">
                {getOutputDataJSON(output.data)}
              </CodeBlock>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export function OutputDataSection({
  chatgptOutput,
  geminiOutput,
  claudeOutput,
  enabledProviders,
  history,
}: OutputDataSectionProps) {
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('')
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const selectedHistory = history.find((h) => h.id === selectedHistoryId)

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            생성 기록
          </CardTitle>
          <CardDescription>이전 생성 결과를 확인할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.length === 0 ? (
            <EmptyState icon={<History className="h-10 w-10 opacity-50" />}>
              <p className="text-sm">아직 생성 기록이 없습니다</p>
            </EmptyState>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="history-select">기록 선택</Label>
                <Select
                  value={selectedHistoryId}
                  onValueChange={setSelectedHistoryId}
                >
                  <SelectTrigger id="history-select">
                    <SelectValue placeholder="기록을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {history.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {formatDateTime(item.timestamp)} -{' '}
                        {item.userPrompt.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedHistory && (
                <div
                  className={cn(
                    // 크기/간격
                    'space-y-3 rounded-lg p-4',
                    // 색상/배경
                    'bg-muted/50 border',
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">선택된 기록</p>
                      <Dialog
                        open={detailDialogOpen}
                        onOpenChange={setDetailDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            상세 보기
                          </Button>
                        </DialogTrigger>
                        <DialogContent
                          className={cn(
                            // 크기/간격
                            'max-h-[80vh] max-w-2xl',
                            // 레이아웃
                            'overflow-y-auto',
                          )}
                        >
                          <DialogHeader>
                            <DialogTitle>생성 기록 상세 정보</DialogTitle>
                            <DialogDescription>
                              {formatDateTime(selectedHistory.timestamp)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* System Prompt */}
                            <div className="space-y-2">
                              <Label>System Prompt</Label>
                              <CodeBlock
                                as="div"
                                mono={false}
                                className="max-h-32"
                              >
                                {selectedHistory.systemPrompt || '없음'}
                              </CodeBlock>
                            </div>

                            {/* User Prompt */}
                            <div className="space-y-2">
                              <Label>User Prompt</Label>
                              <CodeBlock
                                as="div"
                                mono={false}
                                className="max-h-32"
                              >
                                {selectedHistory.userPrompt || '없음'}
                              </CodeBlock>
                            </div>

                            {/* Schema */}
                            {selectedHistory.schema && (
                              <div className="space-y-2">
                                <Label>AI 스키마</Label>
                                <CodeBlock className="max-h-32">
                                  {selectedHistory.schema}
                                </CodeBlock>
                              </div>
                            )}

                            {/* Input Fields */}
                            {selectedHistory.inputFields.length > 0 && (
                              <div className="space-y-2">
                                <Label>입력 데이터</Label>
                                <div className="space-y-2">
                                  {selectedHistory.inputFields.map((field) => (
                                    <div
                                      key={field.id}
                                      className={cn(
                                        // 레이아웃
                                        'flex items-center gap-2',
                                        // 크기/간격
                                        'rounded-md p-2',
                                        // 색상/배경
                                        'bg-muted',
                                      )}
                                    >
                                      <span className="text-sm font-medium">
                                        {field.label}:
                                      </span>
                                      <span className="text-sm">
                                        {field.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* AI Outputs */}
                            <div className="space-y-3">
                              <Label>AI 출력 결과</Label>

                              {selectedHistory.chatgptOutput && (
                                <AIOutputPreview
                                  providerName="ChatGPT"
                                  color="green"
                                  output={selectedHistory.chatgptOutput}
                                />
                              )}

                              {selectedHistory.geminiOutput && (
                                <AIOutputPreview
                                  providerName="Gemini"
                                  color="blue"
                                  output={selectedHistory.geminiOutput}
                                />
                              )}

                              {selectedHistory.claudeOutput && (
                                <AIOutputPreview
                                  providerName="Claude"
                                  color="purple"
                                  output={selectedHistory.claudeOutput}
                                />
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">
                        생성 시간: {formatDateTime(selectedHistory.timestamp)}
                      </p>
                      <p className="text-sm">
                        User Prompt:{' '}
                        {selectedHistory.userPrompt.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ChatGPT Output */}
      <SingleOutputCard
        title="ChatGPT"
        icon={<Bot className="h-5 w-5 text-green-600" />}
        output={chatgptOutput}
        enabled={enabledProviders.chatgpt}
        color="green"
      />

      {/* Gemini Output */}
      <SingleOutputCard
        title="Gemini"
        icon={<Bot className="h-5 w-5 text-blue-600" />}
        output={geminiOutput}
        enabled={enabledProviders.gemini}
        color="blue"
      />

      {/* Claude Output */}
      <SingleOutputCard
        title="Claude"
        icon={<Bot className="h-5 w-5 text-purple-600" />}
        output={claudeOutput}
        enabled={enabledProviders.claude}
        color="purple"
      />
    </div>
  )
}
