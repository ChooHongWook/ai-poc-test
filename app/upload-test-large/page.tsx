'use client'

import { useState, useCallback } from 'react'
import { ConfigurationPanel } from '@/app/(main)/_components/ConfigurationPanel'
import { SystemPromptSection } from '@/app/(main)/_components/SystemPromptSection'
import { UserPromptSection } from '@/app/(main)/_components/UserPromptSection'
import { SchemaSection } from '@/app/(main)/_components/SchemaSection'
import { Toaster } from '@/components/ui/sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Upload,
  Loader2,
  FileSearch,
  X,
  FileText,
  HardDrive,
  Bot,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAIConfig } from '@/lib/providers/ai-config-provider'
import {
  uploadFileChunked,
  startAnalysis,
  generateUploadId,
  type AnalyzeProgress,
  type AnalyzeResult,
} from '@/lib/api/upload-analyze-large'

// 제공자 이름 매핑
const PROVIDER_DISPLAY: Record<string, { label: string; color: string }> = {
  ChatOpenAI: { label: 'ChatGPT', color: 'green' },
  ChatGoogleGenerativeAI: { label: 'Gemini', color: 'blue' },
  ChatAnthropic: { label: 'Claude', color: 'purple' },
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]!
}

export default function UploadTestLargePage() {
  const { chatgpt, gemini, claude, setChatGPT, setGemini, setClaude } =
    useAIConfig()

  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [schema, setSchema] = useState('')

  // 파일 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // 업로드 상태
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null)

  // 분석 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState<AnalyzeProgress | null>(null)
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null)

  // 파일 선택
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setUploadProgress(0)
    setUploadComplete(false)
    setCurrentUploadId(null)
    setAnalyzeProgress(null)
    setAnalyzeResult(null)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = ''
  }

  // 업로드 실행
  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadId = generateUploadId()
      setCurrentUploadId(uploadId)

      await uploadFileChunked(selectedFile, uploadId, (progress) => {
        setUploadProgress(progress.percent)
      })

      setUploadComplete(true)
      toast.success('파일 업로드 완료')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다',
      )
      setCurrentUploadId(null)
    } finally {
      setIsUploading(false)
    }
  }

  // 분석 실행
  const handleAnalyze = () => {
    if (!currentUploadId) return
    if (!chatgpt.enabled && !gemini.enabled && !claude.enabled) {
      toast.error('AI 모델을 하나 이상 활성화해주세요')
      return
    }

    setIsAnalyzing(true)
    setAnalyzeResult(null)
    setAnalyzeProgress(null)

    startAnalysis({
      uploadId: currentUploadId,
      chatgpt,
      gemini,
      claude,
      systemPrompt,
      userPrompt,
      schema,
      onProgress: (progress) => {
        setAnalyzeProgress(progress)
      },
      onResult: (result) => {
        setAnalyzeResult(result)
        setIsAnalyzing(false)
        toast.success('분석이 완료되었습니다!')
      },
      onError: (error) => {
        toast.error(error)
        setIsAnalyzing(false)
      },
    })
  }

  // 초기화
  const handleReset = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setUploadComplete(false)
    setCurrentUploadId(null)
    setIsAnalyzing(false)
    setAnalyzeProgress(null)
    setAnalyzeResult(null)
  }

  return (
    <div className="bg-background min-h-screen">
      <Toaster />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">대용량 파일 분석</h2>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            대용량 파일을 청크 업로드 후 Map-Reduce 방식으로 AI 분석을 수행합니다
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 왼쪽: 설정 + 업로드 */}
          <div className="space-y-6">
            {/* 파일 업로드 영역 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  대용량 파일 업로드
                </CardTitle>
                <CardDescription>
                  파일을 5MB 청크로 분할하여 업로드합니다 (용량 제한 없음)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedFile ? (
                  <div
                    className={cn(
                      'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                      isDragging && 'border-primary bg-primary/5',
                      !isDragging &&
                        'border-muted-foreground/25 hover:border-primary/50',
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById('large-file-input')?.click()
                    }
                  >
                    <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <p className="mb-1 text-sm font-medium">
                      클릭하거나 파일을 드래그하여 업로드
                    </p>
                    <p className="text-muted-foreground text-xs">
                      대용량 파일 지원 (TXT, CSV, PDF, MD)
                    </p>
                    <input
                      id="large-file-input"
                      type="file"
                      className="hidden"
                      accept=".txt,.csv,.pdf,.md"
                      onChange={handleFileInputChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 선택된 파일 정보 */}
                    <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                      <FileText className="h-5 w-5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      {!isUploading && !isAnalyzing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleReset}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* 업로드 진행률 */}
                    {(isUploading || uploadComplete) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>업로드 진행률</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                        {uploadComplete && (
                          <p className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            업로드 완료
                          </p>
                        )}
                      </div>
                    )}

                    {/* 업로드 버튼 */}
                    {!uploadComplete && (
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            업로드 중... ({uploadProgress}%)
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            파일 업로드 시작
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

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

            {/* 분석 실행 버튼 */}
            <Button
              onClick={handleAnalyze}
              disabled={!uploadComplete || isAnalyzing}
              size="lg"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Map-Reduce 분석 중...
                </>
              ) : (
                <>
                  <FileSearch className="mr-2 h-5 w-5" />
                  대용량 파일 분석 시작
                </>
              )}
            </Button>
          </div>

          {/* 오른쪽: 분석 진행 상황 + 결과 */}
          <div className="space-y-6">
            {/* 분석 진행 상황 */}
            {analyzeProgress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2
                      className={cn(
                        'h-5 w-5',
                        isAnalyzing && 'animate-spin',
                      )}
                    />
                    분석 진행 상황
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{analyzeProgress.message}</span>
                      <span>{analyzeProgress.progress}%</span>
                    </div>
                    <Progress value={analyzeProgress.progress} />
                  </div>
                  {analyzeProgress.provider && (
                    <Badge variant="outline">
                      {PROVIDER_DISPLAY[analyzeProgress.provider]?.label ??
                        analyzeProgress.provider}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 분석 결과 */}
            {analyzeResult && (
              <>
                {/* 분석 요약 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      분석 완료
                    </CardTitle>
                    <CardDescription>
                      {analyzeResult.fileName} ({formatFileSize(analyzeResult.fileSize)}) - {analyzeResult.chunks}개 청크 처리
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* 각 제공자별 결과 */}
                {analyzeResult.results.map((result) => {
                  const display = PROVIDER_DISPLAY[result.provider]
                  return (
                    <Card
                      key={result.provider}
                      className={
                        result.success
                          ? `border-${display?.color ?? 'gray'}-200`
                          : 'border-red-200'
                      }
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Bot
                            className={cn(
                              'h-4 w-4',
                              `text-${display?.color ?? 'gray'}-600`,
                            )}
                          />
                          {display?.label ?? result.provider}
                          {result.success ? (
                            <Badge variant="default" className="ml-auto">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              완료
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="ml-auto">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              실패
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {result.success && result.structuredOutput ? (
                          <div className="space-y-2">
                            {Object.entries(result.structuredOutput).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="bg-muted flex items-start gap-2 rounded-md p-2"
                                >
                                  <span className="text-sm font-medium whitespace-nowrap">
                                    {key}:
                                  </span>
                                  <span className="text-sm">
                                    {String(value)}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-red-600">
                            {result.error ?? '알 수 없는 오류'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            )}

            {/* 빈 상태 */}
            {!analyzeProgress && !analyzeResult && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileSearch className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    파일을 업로드하고 분석을 시작하면 결과가 여기에 표시됩니다
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
