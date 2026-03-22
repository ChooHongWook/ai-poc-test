'use client'

import { useState } from 'react'
import { ConfigurationPanel } from '@/app/(main)/_components/ConfigurationPanel'
import { SystemPromptSection } from '@/app/(main)/_components/SystemPromptSection'
import { UserPromptSection } from '@/app/(main)/_components/UserPromptSection'
import { SchemaSection } from '@/app/(main)/_components/SchemaSection'
import { FileUploadSection } from '@/app/(main)/_components/FileUploadSection'
import { Toaster } from '@/components/ui/sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
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
import { CodeBlock } from '@/components/ui/code-block'
import { EmptyState } from '@/components/ui/empty-state'
import { AIOutputPreview } from '@/app/(main)/_components/AIOutputPreview'
import {
  Upload,
  Loader2,
  Bot,
  CheckCircle2,
  FileSearch,
  History,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAIConfig } from '@/lib/providers/ai-config-provider'
import { useHistory } from '@/lib/providers/history-provider'
import { analyzeUpload } from '@/lib/api/upload-analyze'
import type { AIOutput } from '@/lib/types'

interface UploadedFile {
  id: string
  file: File
  name: string
  size: string
  type: string
}

const borderColorMap: Record<string, string> = {
  green: 'border-green-200',
  blue: 'border-blue-200',
  purple: 'border-purple-200',
}

function AnalysisResultCard({
  title,
  color,
  output,
  enabled,
}: {
  title: string
  color: string
  output: AIOutput
  enabled: boolean
}) {
  if (!enabled) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className={cn('h-4 w-4', `text-${color}-600`)} />
            {title}
            <Badge variant="secondary" className="ml-auto">
              비활성화
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!output.generated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className={cn('h-4 w-4', `text-${color}-600`)} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            분석을 실행해주세요
          </p>
        </CardContent>
      </Card>
    )
  }

  const keys = Object.keys(output.data)

  return (
    <Card className={borderColorMap[color]}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className={cn('h-4 w-4', `text-${color}-600`)} />
          {title}
          <Badge variant="default" className="ml-auto">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            완료
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fields">필드 보기</TabsTrigger>
            <TabsTrigger value="json">JSON 보기</TabsTrigger>
          </TabsList>
          <TabsContent value="fields" className="space-y-2">
            {keys.map((key) => (
              <div
                key={key}
                className="bg-muted flex items-start gap-2 rounded-md p-2"
              >
                <span className="text-sm font-medium whitespace-nowrap">
                  {key}:
                </span>
                <span className="text-sm">{output.data[key]}</span>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="json">
            <pre className="bg-muted max-h-64 overflow-auto rounded-lg p-4 text-xs">
              {JSON.stringify(output.data, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default function UploadTestPage() {
  const { chatgpt, gemini, claude, setChatGPT, setGemini, setClaude } =
    useAIConfig()
  const { history, addHistory } = useHistory()

  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [schema, setSchema] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [chatgptOutput, setChatGPTOutput] = useState<AIOutput>({
    data: {},
    generated: false,
  })
  const [geminiOutput, setGeminiOutput] = useState<AIOutput>({
    data: {},
    generated: false,
  })
  const [claudeOutput, setClaudeOutput] = useState<AIOutput>({
    data: {},
    generated: false,
  })

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

  const handleAnalyze = async () => {
    if (!chatgpt.enabled && !gemini.enabled && !claude.enabled) {
      toast.error('AI 모델을 하나 이상 활성화해주세요')
      return
    }
    if (uploadedFiles.length === 0) {
      toast.error('파일을 업로드해주세요')
      return
    }

    setIsAnalyzing(true)

    try {
      const result = await analyzeUpload({
        files: uploadedFiles.map((f) => f.file),
        chatgpt,
        gemini,
        claude,
        systemPrompt,
        userPrompt,
        schema,
      })

      if (result.chatgptOutput) setChatGPTOutput(result.chatgptOutput)
      if (result.geminiOutput) setGeminiOutput(result.geminiOutput)
      if (result.claudeOutput) setClaudeOutput(result.claudeOutput)

      addHistory(result.historyItem)
      toast.success('파일 분석이 완료되었습니다!')
    } catch (error) {
      toast.error('파일 분석 중 오류가 발생했습니다')
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeButton = (
    <Button
      onClick={handleAnalyze}
      disabled={isAnalyzing}
      size="lg"
      className="w-full"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          파일 분석 중...
        </>
      ) : (
        <>
          <FileSearch className="mr-2 h-5 w-5" />
          파일 분석 테스트
        </>
      )}
    </Button>
  )

  return (
    <div className="bg-background min-h-screen">
      <Toaster />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">파일 분석 테스트</h2>
          <p className="text-muted-foreground text-sm">
            파일을 업로드하고 각 AI 제공자의 분석 결과를 비교합니다
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 왼쪽: 설정 + 업로드 */}
          <div className="space-y-6">
            {analyzeButton}

            <ConfigurationPanel
              chatgpt={chatgpt}
              gemini={gemini}
              claude={claude}
              onChatGPTChange={setChatGPT}
              onGeminiChange={setGemini}
              onClaudeChange={setClaude}
            />

            <SystemPromptSection
              value={systemPrompt}
              onChange={setSystemPrompt}
            />

            <UserPromptSection value={userPrompt} onChange={setUserPrompt} />

            <SchemaSection value={schema} onChange={setSchema} />

            <FileUploadSection
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
            />

            {/* 업로드 상태 */}
            {uploadedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    업로드 상태
                  </CardTitle>
                  <CardDescription>
                    업로드된 파일 상세 정보
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">총 파일 수:</span>
                      <Badge variant="secondary">
                        {uploadedFiles.length}개
                      </Badge>
                    </div>
                    <pre className="bg-muted max-h-48 overflow-auto rounded-lg p-4 text-xs">
                      {JSON.stringify(
                        uploadedFiles.map(({ id, name, size, type }) => ({
                          id,
                          name,
                          size,
                          type,
                        })),
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {analyzeButton}
          </div>

          {/* 오른쪽: 생성 기록 + AI 분석 결과 */}
          <div className="space-y-6">
            {/* 생성 기록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  생성 기록
                </CardTitle>
                <CardDescription>
                  이전 파일 분석 결과를 확인할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {history.length === 0 ? (
                  <EmptyState
                    icon={<History className="h-10 w-10 opacity-50" />}
                  >
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
                          'space-y-3 rounded-lg p-4',
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
                                  'max-h-[80vh] max-w-2xl',
                                  'overflow-y-auto',
                                )}
                              >
                                <DialogHeader>
                                  <DialogTitle>
                                    파일 분석 기록 상세 정보
                                  </DialogTitle>
                                  <DialogDescription>
                                    {formatDateTime(selectedHistory.timestamp)}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
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
                                  <div className="space-y-2">
                                    <Label>AI 스키마</Label>
                                    {selectedHistory.schema ? (
                                      <CodeBlock className="max-h-32">
                                        {selectedHistory.schema}
                                      </CodeBlock>
                                    ) : (
                                      <p className="text-muted-foreground text-sm">
                                        없음
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label>분석 파일</Label>
                                    {selectedHistory.inputFields.length > 0 ? (
                                      <div className="space-y-2">
                                        {selectedHistory.inputFields.map(
                                          (field) => (
                                            <div
                                              key={field.id}
                                              className={cn(
                                                'flex items-center gap-2',
                                                'rounded-md p-2',
                                                'bg-muted',
                                              )}
                                            >
                                              <span className="text-sm font-medium">
                                                {field.label}
                                              </span>
                                              <span className="text-muted-foreground text-xs">
                                                ({field.value})
                                              </span>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground text-sm">
                                        없음
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    <Label>AI 분석 결과</Label>
                                    {selectedHistory.chatgptOutput && (
                                      <AIOutputPreview
                                        providerName="ChatGPT"
                                        color="green"
                                        output={selectedHistory.chatgptOutput}
                                        modelName={
                                          selectedHistory.models?.chatgpt
                                        }
                                      />
                                    )}
                                    {selectedHistory.geminiOutput && (
                                      <AIOutputPreview
                                        providerName="Gemini"
                                        color="blue"
                                        output={selectedHistory.geminiOutput}
                                        modelName={
                                          selectedHistory.models?.gemini
                                        }
                                      />
                                    )}
                                    {selectedHistory.claudeOutput && (
                                      <AIOutputPreview
                                        providerName="Claude"
                                        color="purple"
                                        output={selectedHistory.claudeOutput}
                                        modelName={
                                          selectedHistory.models?.claude
                                        }
                                      />
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs">
                              생성 시간:{' '}
                              {formatDateTime(selectedHistory.timestamp)}
                            </p>
                            <p className="text-sm">
                              {selectedHistory.userPrompt.substring(0, 50)}
                              ...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <AnalysisResultCard
              title="ChatGPT"
              color="green"
              output={chatgptOutput}
              enabled={chatgpt.enabled}
            />
            <AnalysisResultCard
              title="Gemini"
              color="blue"
              output={geminiOutput}
              enabled={gemini.enabled}
            />
            <AnalysisResultCard
              title="Claude"
              color="purple"
              output={claudeOutput}
              enabled={claude.enabled}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
