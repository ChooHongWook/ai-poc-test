'use client'

import { useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface UploadedFile {
  id: string
  file: File
  name: string
  size: string
  type: string
}

interface FileUploadSectionProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
}

export function FileUploadSection({
  files,
  onFilesChange,
}: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: Date.now().toString() + Math.random().toString(),
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
    }))

    onFilesChange([...files, ...newFiles])
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

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
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (id: string) => {
    onFilesChange(files.filter((file) => file.id !== id))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          파일 업로드
        </CardTitle>
        <CardDescription>문서 생성에 사용할 파일을 업로드하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            // 레이아웃
            'cursor-pointer p-8 text-center',
            // 크기/간격
            'rounded-lg',
            // 색상/배경
            'border-2 border-dashed',
            // 인터랙션
            'transition-colors',
            // 상태
            isDragging && 'border-primary bg-primary/5',
            !isDragging && 'border-muted-foreground/25 hover:border-primary/50',
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="mb-1 text-sm font-medium">
            클릭하거나 파일을 드래그하여 업로드
          </p>
          <p className="text-muted-foreground text-xs">
            PDF, DOCX, TXT, 이미지 등 모든 파일 형식 지원
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">업로드된 파일</p>
              <Badge variant="secondary">{files.length}개</Badge>
            </div>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    // 레이아웃
                    'flex items-center gap-3',
                    // 크기/간격
                    'rounded-lg p-3',
                    // 색상/배경
                    'bg-muted',
                    // 인터랙션
                    'group hover:bg-muted/80 transition-colors',
                  )}
                >
                  <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{file.size}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      // 크기/간격
                      'flex-shrink-0',
                      // 인터랙션
                      'opacity-0 transition-opacity group-hover:opacity-100',
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(file.id)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
