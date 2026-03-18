// 파일 처리 유틸리티 - 업로드된 파일을 AI 프로바이더용으로 변환

import type { ProcessedFile } from "@/lib/ai/types";

// 지원 파일 타입 정의
const SUPPORTED_MIME_TYPES = {
  images: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  documents: ["application/pdf"],
  text: ["text/plain", "text/csv", "text/markdown", "application/json"],
} as const;

// 파일 크기 제한 (바이트)
const FILE_SIZE_LIMITS = {
  image: 20 * 1024 * 1024,    // 20MB
  document: 50 * 1024 * 1024, // 50MB
  text: 5 * 1024 * 1024,      // 5MB
} as const;

// 최대 파일 개수 제한
const MAX_FILE_COUNT = 10;

/**
 * 주어진 MIME 타입이 지원되는지 여부를 반환
 */
export function isSupportedFileType(mimeType: string): boolean {
  const allSupported = [
    ...SUPPORTED_MIME_TYPES.images,
    ...SUPPORTED_MIME_TYPES.documents,
    ...SUPPORTED_MIME_TYPES.text,
  ] as string[];
  return allSupported.includes(mimeType);
}

/**
 * MIME 타입에 따른 파일 크기 제한(바이트)을 반환
 */
export function getFileSizeLimit(mimeType: string): number {
  if ((SUPPORTED_MIME_TYPES.images as readonly string[]).includes(mimeType)) {
    return FILE_SIZE_LIMITS.image;
  }
  if ((SUPPORTED_MIME_TYPES.documents as readonly string[]).includes(mimeType)) {
    return FILE_SIZE_LIMITS.document;
  }
  // 텍스트 파일 및 기타
  return FILE_SIZE_LIMITS.text;
}

/**
 * 파일 유효성 검사 결과 타입
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 파일 유효성 검사 - 지원 타입 및 크기 제한 확인
 */
export function validateFile(file: File): FileValidationResult {
  // 지원 타입 검사
  if (!isSupportedFileType(file.type)) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다: ${file.type || "알 수 없음"}. 이미지(JPEG, PNG, WebP, GIF), PDF, 텍스트(TXT, CSV, MD, JSON) 파일만 지원합니다.`,
    };
  }

  // 파일 크기 검사
  const sizeLimit = getFileSizeLimit(file.type);
  if (file.size > sizeLimit) {
    const limitMB = Math.round(sizeLimit / 1024 / 1024);
    const fileMB = Math.round(file.size / 1024 / 1024 * 100) / 100;
    return {
      valid: false,
      error: `파일 크기가 초과되었습니다: ${fileMB}MB (최대 ${limitMB}MB). 파일: ${file.name}`,
    };
  }

  return { valid: true };
}

/**
 * 파일 개수 제한 검사
 */
export function validateFileCount(currentCount: number, additionalCount: number): FileValidationResult {
  if (currentCount + additionalCount > MAX_FILE_COUNT) {
    return {
      valid: false,
      error: `파일은 최대 ${MAX_FILE_COUNT}개까지 업로드할 수 있습니다. 현재 ${currentCount}개가 있어 ${additionalCount}개를 추가할 수 없습니다.`,
    };
  }
  return { valid: true };
}

/**
 * File을 base64 문자열로 변환 (브라우저 환경용 FileReader 사용)
 */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") {
        reject(new Error("FileReader 결과가 문자열이 아닙니다"));
        return;
      }
      // data:mimetype;base64,{data} 형식에서 base64 부분만 추출
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("base64 데이터를 추출할 수 없습니다"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`파일 읽기 실패: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * 텍스트 파일의 텍스트 내용을 추출
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") {
        reject(new Error("텍스트 읽기 결과가 문자열이 아닙니다"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error(`텍스트 파일 읽기 실패: ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * 주어진 MIME 타입이 텍스트 파일인지 확인
 */
function isTextFile(mimeType: string): boolean {
  return (SUPPORTED_MIME_TYPES.text as readonly string[]).includes(mimeType);
}

/**
 * 파일을 ProcessedFile로 변환 (base64 인코딩)
 * - 유효성 검사
 * - base64 인코딩
 * - 텍스트 파일은 textContent도 추출
 */
export async function processFile(file: File): Promise<ProcessedFile> {
  // 파일 유효성 검사
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // base64 인코딩
  const base64Data = await readFileAsBase64(file);

  // 텍스트 파일은 textContent 추출
  let textContent: string | undefined;
  if (isTextFile(file.type)) {
    textContent = await readFileAsText(file);
  }

  return {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    base64Data,
    textContent,
  };
}

/**
 * 여러 파일 일괄 처리
 */
export async function processFiles(files: File[]): Promise<ProcessedFile[]> {
  return Promise.all(files.map(processFile));
}
