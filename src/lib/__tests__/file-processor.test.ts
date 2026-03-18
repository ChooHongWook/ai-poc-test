// 파일 처리 유틸리티 단위 테스트
import { describe, it, expect } from "vitest";
import {
  isSupportedFileType,
  getFileSizeLimit,
  validateFile,
  validateFileCount,
} from "../file-processor";

// 파일 크기 상수 (바이트)
const MB = 1024 * 1024;

// 테스트용 File 객체 생성 헬퍼
function createMockFile(name: string, mimeType: string, sizeBytes: number): File {
  // Blob을 File로 래핑하여 File 객체 생성
  const blob = new Blob(["x".repeat(Math.min(sizeBytes, 100))], { type: mimeType });
  return new File([blob], name, { type: mimeType, lastModified: Date.now() });
}

// 특정 크기의 File 객체 생성 헬퍼 (size를 직접 설정)
function createMockFileWithSize(name: string, mimeType: string, sizeBytes: number): File {
  // File의 size는 Blob 내용 크기로 결정되므로 실제 크기로 생성
  const content = new Uint8Array(sizeBytes);
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], name, { type: mimeType });
}

describe("isSupportedFileType", () => {
  it("image/jpeg는 지원 타입이어야 한다", () => {
    expect(isSupportedFileType("image/jpeg")).toBe(true);
  });

  it("image/png는 지원 타입이어야 한다", () => {
    expect(isSupportedFileType("image/png")).toBe(true);
  });

  it("image/webp는 지원 타입이어야 한다", () => {
    expect(isSupportedFileType("image/webp")).toBe(true);
  });

  it("image/gif는 지원 타입이어야 한다", () => {
    expect(isSupportedFileType("image/gif")).toBe(true);
  });

  it("application/pdf는 지원 타입이어야 한다", () => {
    expect(isSupportedFileType("application/pdf")).toBe(true);
  });

  it("text/plain은 지원 타입이어야 한다", () => {
    expect(isSupportedFileType("text/plain")).toBe(true);
  });

  it("text/csv는 지원 타입이어야 한다", () => {
    expect(isSupportedFileType("text/csv")).toBe(true);
  });

  it("application/json은 지원 타입이어야 한다", () => {
    expect(isSupportedFileType("application/json")).toBe(true);
  });

  it("application/exe는 지원 타입이 아니어야 한다", () => {
    expect(isSupportedFileType("application/exe")).toBe(false);
  });

  it("video/mp4는 지원 타입이 아니어야 한다", () => {
    expect(isSupportedFileType("video/mp4")).toBe(false);
  });

  it("빈 문자열은 지원 타입이 아니어야 한다", () => {
    expect(isSupportedFileType("")).toBe(false);
  });
});

describe("getFileSizeLimit", () => {
  it("이미지 파일의 크기 제한은 20MB여야 한다", () => {
    // 이미지 타입별 20MB 제한 확인
    expect(getFileSizeLimit("image/jpeg")).toBe(20 * MB);
    expect(getFileSizeLimit("image/png")).toBe(20 * MB);
    expect(getFileSizeLimit("image/webp")).toBe(20 * MB);
  });

  it("PDF 파일의 크기 제한은 50MB여야 한다", () => {
    // PDF는 50MB 제한
    expect(getFileSizeLimit("application/pdf")).toBe(50 * MB);
  });

  it("텍스트 파일의 크기 제한은 5MB여야 한다", () => {
    // 텍스트 타입별 5MB 제한 확인
    expect(getFileSizeLimit("text/plain")).toBe(5 * MB);
    expect(getFileSizeLimit("text/csv")).toBe(5 * MB);
    expect(getFileSizeLimit("application/json")).toBe(5 * MB);
  });

  it("알 수 없는 타입은 기본값(5MB)을 반환해야 한다", () => {
    // 지원하지 않는 타입은 텍스트 제한 반환
    expect(getFileSizeLimit("unknown/type")).toBe(5 * MB);
  });
});

describe("validateFile", () => {
  it("유효한 이미지 파일은 통과해야 한다", () => {
    // 지원 타입 + 허용 크기 이내
    const file = createMockFile("test.jpg", "image/jpeg", 1 * MB);
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("유효한 PDF 파일은 통과해야 한다", () => {
    const file = createMockFile("test.pdf", "application/pdf", 1 * MB);
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it("지원하지 않는 파일 타입은 거부해야 한다", () => {
    // application/exe는 미지원
    const file = createMockFile("test.exe", "application/exe", 1 * MB);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("이미지 파일이 20MB를 초과하면 거부해야 한다", () => {
    // 21MB 크기의 JPEG 파일
    const file = createMockFileWithSize("large.jpg", "image/jpeg", 21 * MB);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("PDF 파일이 50MB를 초과하면 거부해야 한다", () => {
    // 51MB 크기의 PDF 파일
    const file = createMockFileWithSize("large.pdf", "application/pdf", 51 * MB);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("텍스트 파일이 5MB를 초과하면 거부해야 한다", () => {
    // 6MB 크기의 텍스트 파일
    const file = createMockFileWithSize("large.txt", "text/plain", 6 * MB);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe("validateFileCount", () => {
  it("현재 파일 수 + 추가 파일 수가 10 이하이면 통과해야 한다", () => {
    // 5 + 5 = 10, 허용됨
    const result = validateFileCount(5, 5);
    expect(result.valid).toBe(true);
  });

  it("파일이 없는 상태에서 10개 추가는 통과해야 한다", () => {
    const result = validateFileCount(0, 10);
    expect(result.valid).toBe(true);
  });

  it("현재 파일 수 + 추가 파일 수가 11 이상이면 거부해야 한다", () => {
    // 5 + 6 = 11, 거부됨
    const result = validateFileCount(5, 6);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("이미 10개인 상태에서 1개 추가는 거부해야 한다", () => {
    const result = validateFileCount(10, 1);
    expect(result.valid).toBe(false);
  });

  it("에러 메시지에 최대 파일 수가 포함되어야 한다", () => {
    const result = validateFileCount(8, 5);
    expect(result.valid).toBe(false);
    // 최대 10개 제한이 메시지에 포함됨
    expect(result.error).toContain("10");
  });
});
