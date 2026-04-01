'use client'

import { useState, useCallback, useEffect } from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Upload,
  Loader2,
  FileText,
  X,
  Trash2,
  Database,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAIConfig } from '@/lib/providers/ai-config-provider'
import {
  uploadFileChunked,
  generateUploadId,
} from '@/lib/api/upload-analyze-large'
import {
  fetchDocuments,
  removeDocument,
  startIngest,
  type RagDocument,
  type IngestProgress,
} from '@/lib/api/rag'
import type { EmbeddingProvider } from '@/lib/langchain/embedding-factory'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]!
}

interface DocumentPanelProps {
  selectedDocIds: number[]
  onDocSelectionChange: (ids: number[]) => void
}

export function DocumentPanel({
  selectedDocIds,
  onDocSelectionChange,
}: DocumentPanelProps) {
  const { chatgpt, gemini } = useAIConfig()

  // 문서 목록
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(true)

  // 파일 업로드 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null)

  // 인제스트 상태
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestProgress, setIngestProgress] = useState<IngestProgress | null>(null)

  // 임베딩 설정
  const [embeddingProvider, setEmbeddingProvider] = useState<EmbeddingProvider>('openai')

  // 임베딩 API 키 자동 추출
  const embeddingApiKey =
    embeddingProvider === 'openai' ? chatgpt.apiKey : gemini.apiKey

  // 문서 목록 로드
  const loadDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments()
      setDocuments(docs)
    } catch {
      // DB 연결 실패 시 빈 목록 유지
    } finally {
      setIsLoadingDocs(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // 파일 선택
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setUploadProgress(0)
    setUploadComplete(false)
    setCurrentUploadId(null)
    setIngestProgress(null)
  }, [])

  // 드래그 앤 드롭
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

  // 업로드 + 인제스트 실행
  const handleUploadAndIngest = async () => {
    if (!selectedFile) return
    if (!embeddingApiKey) {
      toast.error(
        embeddingProvider === 'openai'
          ? 'OpenAI API 키를 설정해주세요 (Settings 페이지)'
          : 'Google API 키를 설정해주세요 (Settings 페이지)',
      )
      return
    }

    // 1. 청크 업로드
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadId = generateUploadId()
      setCurrentUploadId(uploadId)

      await uploadFileChunked(selectedFile, uploadId, (progress) => {
        setUploadProgress(progress.percent)
      })

      setUploadComplete(true)

      // 2. 인제스트 시작
      setIsIngesting(true)
      setIngestProgress(null)

      startIngest({
        uploadId,
        embeddingProvider,
        embeddingApiKey,
        onProgress: (progress) => {
          setIngestProgress(progress)
        },
        onResult: () => {
          setIsIngesting(false)
          toast.success('문서가 벡터 DB에 저장되었습니다')
          handleReset()
          loadDocuments()
        },
        onError: (error) => {
          setIsIngesting(false)
          toast.error(error)
        },
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다',
      )
      setCurrentUploadId(null)
    } finally {
      setIsUploading(false)
    }
  }

  // 리셋
  const handleReset = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setUploadComplete(false)
    setCurrentUploadId(null)
    setIsIngesting(false)
    setIngestProgress(null)
  }

  // 문서 삭제
  const handleDelete = async (docId: number) => {
    try {
      await removeDocument(docId)
      onDocSelectionChange(selectedDocIds.filter((id) => id !== docId))
      await loadDocuments()
      toast.success('문서가 삭제되었습니다')
    } catch {
      toast.error('문서 삭제에 실패했습니다')
    }
  }

  // 문서 선택 토글
  const toggleDocSelection = (docId: number) => {
    if (selectedDocIds.includes(docId)) {
      onDocSelectionChange(selectedDocIds.filter((id) => id !== docId))
    } else {
      onDocSelectionChange([...selectedDocIds, docId])
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* 파일 업로드 영역 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4" />
            문서 업로드
          </CardTitle>
          <CardDescription className="text-xs">
            RAG 벡터 DB에 문서를 추가합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 임베딩 제공자 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium">임베딩 모델</label>
            <Select
              value={embeddingProvider}
              onValueChange={(v) => setEmbeddingProvider(v as EmbeddingProvider)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (text-embedding-3-small)</SelectItem>
                <SelectItem value="google">Google (text-embedding-004)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!selectedFile ? (
            <div
              className={cn(
                'cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors',
                isDragging && 'border-primary bg-primary/5',
                !isDragging && 'border-muted-foreground/25 hover:border-primary/50',
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('rag-file-input')?.click()}
            >
              <Upload className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
              <p className="text-xs font-medium">파일 드래그 또는 클릭</p>
              <p className="text-muted-foreground text-xs">TXT, CSV, PDF, MD</p>
              <input
                id="rag-file-input"
                type="file"
                className="hidden"
                accept=".txt,.csv,.pdf,.md"
                onChange={handleFileInputChange}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-muted flex items-center gap-2 rounded-lg p-2">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{selectedFile.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && !isIngesting && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleReset}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* 진행 상태 */}
              {(isUploading || uploadComplete || isIngesting) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>
                      {isIngesting
                        ? ingestProgress?.message ?? '인제스트 중...'
                        : isUploading
                          ? '업로드 중...'
                          : '업로드 완료'}
                    </span>
                    <span>
                      {isIngesting
                        ? `${ingestProgress?.progress ?? 0}%`
                        : `${uploadProgress}%`}
                    </span>
                  </div>
                  <Progress
                    value={isIngesting ? (ingestProgress?.progress ?? 0) : uploadProgress}
                  />
                </div>
              )}

              {/* 업로드 + 인제스트 버튼 */}
              {!uploadComplete && !isIngesting && (
                <Button
                  onClick={handleUploadAndIngest}
                  disabled={isUploading}
                  size="sm"
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Database className="mr-1 h-3 w-3" />
                      벡터 DB에 저장
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 문서 목록 */}
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            저장된 문서
            <Badge variant="secondary" className="ml-auto text-xs">
              {documents.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4 pb-4">
            {isLoadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-xs">
                저장된 문서가 없습니다
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(
                      'group flex items-center gap-2 rounded-lg border p-2 transition-colors cursor-pointer',
                      selectedDocIds.includes(doc.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted',
                    )}
                    onClick={() => toggleDocSelection(doc.id)}
                  >
                    {selectedDocIds.includes(doc.id) && (
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{doc.fileName}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatFileSize(doc.fileSize)} · {doc.chunkCount}청크 · {doc.embeddingModel}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(doc.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
