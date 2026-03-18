"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, File, X, FileText, Image as ImageIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { validateFile } from "@/lib/file-processor";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
}

interface FileUploadSectionProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

export function FileUploadSection({ files, onFilesChange }: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    // 최대 파일 개수 제한 (10개)
    const MAX_FILE_COUNT = 10;
    const selectedArray = Array.from(selectedFiles);

    if (files.length >= MAX_FILE_COUNT) {
      toast.error(`파일은 최대 ${MAX_FILE_COUNT}개까지 업로드할 수 있습니다`);
      return;
    }

    // 유효성 검사 통과한 파일만 처리
    const validFiles: UploadedFile[] = [];

    for (const file of selectedArray) {
      // 최대 파일 개수 초과 여부 확인
      if (files.length + validFiles.length >= MAX_FILE_COUNT) {
        toast.error(`파일은 최대 ${MAX_FILE_COUNT}개까지 업로드할 수 있습니다. 일부 파일이 추가되지 않았습니다.`);
        break;
      }

      // 개별 파일 유효성 검사
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error ?? `파일 검증 실패: ${file.name}`);
        continue;
      }

      validFiles.push({
        id: Date.now().toString() + Math.random().toString(),
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
      });
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter((file) => file.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          파일 업로드
        </CardTitle>
        <CardDescription>문서 생성에 사용할 파일을 업로드하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            클릭하거나 파일을 드래그하여 업로드
          </p>
          <p className="text-xs text-muted-foreground">
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
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg group hover:bg-muted/80 transition-colors"
                >
                  <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
