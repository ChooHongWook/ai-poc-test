// 에러 유틸리티 단위 테스트
import { describe, it, expect } from "vitest";
import {
  AppError,
  createErrorResponse,
  getErrorMessage,
  mapProviderError,
} from "../errors";
import type { ErrorCode } from "../types";

// 모든 에러 코드 목록 (타입에서 추론)
const ALL_ERROR_CODES: ErrorCode[] = [
  "VALIDATION_ERROR",
  "MISSING_API_KEY",
  "INVALID_SCHEMA",
  "PROVIDER_ERROR",
  "RATE_LIMIT_EXCEEDED",
  "TIMEOUT",
  "FILE_TOO_LARGE",
  "UNSUPPORTED_FILE_TYPE",
  "INTERNAL_ERROR",
];

describe("AppError", () => {
  it("올바른 code, statusCode, details를 설정해야 한다", () => {
    // 에러 코드별 속성이 올바르게 설정되어야 함
    const details = { field: "providers" };
    const error = new AppError("VALIDATION_ERROR", undefined, details);

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual(details);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it("message가 없으면 한국어 기본 메시지를 사용해야 한다", () => {
    // 메시지 미제공 시 한국어 기본값 사용
    const error = new AppError("MISSING_API_KEY");
    expect(error.message).toBe("API 키가 유효하지 않습니다");
  });

  it("커스텀 메시지가 기본 메시지보다 우선해야 한다", () => {
    // 커스텀 메시지 제공 시 해당 메시지 사용
    const customMessage = "사용자 정의 에러 메시지";
    const error = new AppError("PROVIDER_ERROR", customMessage);
    expect(error.message).toBe(customMessage);
  });

  it("name 속성이 AppError여야 한다", () => {
    const error = new AppError("INTERNAL_ERROR");
    expect(error.name).toBe("AppError");
  });

  it("RATE_LIMIT_EXCEEDED의 statusCode가 429이어야 한다", () => {
    const error = new AppError("RATE_LIMIT_EXCEEDED");
    expect(error.statusCode).toBe(429);
  });

  it("TIMEOUT의 statusCode가 504이어야 한다", () => {
    const error = new AppError("TIMEOUT");
    expect(error.statusCode).toBe(504);
  });
});

describe("createErrorResponse", () => {
  it("APIErrorResponse 형식으로 반환해야 한다", () => {
    // 반환값이 올바른 형식이어야 함
    const response = createErrorResponse("VALIDATION_ERROR");
    expect(response).toMatchObject({
      success: false,
      error: "VALIDATION_ERROR",
    });
  });

  it("올바른 필드를 포함해야 한다 (success, error, message)", () => {
    // 필수 필드가 모두 포함되어야 함
    const response = createErrorResponse("INTERNAL_ERROR", "서버 에러 발생");
    expect(response).toHaveProperty("success", false);
    expect(response).toHaveProperty("error", "INTERNAL_ERROR");
    expect(response).toHaveProperty("message", "서버 에러 발생");
  });

  it("커스텀 메시지 없이 호출하면 기본 한국어 메시지를 사용해야 한다", () => {
    const response = createErrorResponse("FILE_TOO_LARGE");
    expect(response.message).toBe("파일 크기가 너무 큽니다");
  });

  it("details 필드가 제공되면 응답에 포함되어야 한다", () => {
    const details = { maxSize: "20MB" };
    const response = createErrorResponse("FILE_TOO_LARGE", undefined, details);
    expect(response.details).toEqual(details);
  });
});

describe("ERROR_MESSAGES (getErrorMessage를 통해 검증)", () => {
  it("모든 ErrorCode에 대해 한국어 메시지가 존재해야 한다", () => {
    // 각 에러 코드에 대해 메시지가 존재하고 한국어여야 함
    for (const code of ALL_ERROR_CODES) {
      const message = getErrorMessage(code);
      expect(message).toBeTruthy();
      expect(typeof message).toBe("string");
      expect(message.length).toBeGreaterThan(0);
    }
  });
});

describe("mapProviderError", () => {
  it("401 에러는 MISSING_API_KEY로 매핑되어야 한다", () => {
    // HTTP 401 상태 코드를 가진 에러 객체 모킹
    const error = Object.assign(new Error("Unauthorized"), { status: 401 });
    const result = mapProviderError("chatgpt", error);

    expect(result.provider).toBe("chatgpt");
    expect(result.code).toBe("MISSING_API_KEY");
    expect(result.httpStatus).toBe(401);
  });

  it("403 에러도 MISSING_API_KEY로 매핑되어야 한다", () => {
    // HTTP 403 상태 코드
    const error = Object.assign(new Error("Forbidden"), { status: 403 });
    const result = mapProviderError("gemini", error);
    expect(result.code).toBe("MISSING_API_KEY");
  });

  it("429 에러는 RATE_LIMIT_EXCEEDED로 매핑되어야 한다", () => {
    // HTTP 429 상태 코드
    const error = Object.assign(new Error("Too Many Requests"), { status: 429 });
    const result = mapProviderError("claude", error);

    expect(result.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(result.httpStatus).toBe(429);
  });

  it("'rate limit' 문자열을 포함한 에러 메시지는 RATE_LIMIT_EXCEEDED로 매핑되어야 한다", () => {
    // 상태 코드 없이 메시지로 감지
    const error = new Error("Rate limit exceeded. Please try again later.");
    const result = mapProviderError("chatgpt", error);
    expect(result.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("'timeout' 문자열을 포함한 에러는 TIMEOUT으로 매핑되어야 한다", () => {
    // 타임아웃 에러 감지
    const error = new Error("Request timeout after 30 seconds");
    const result = mapProviderError("gemini", error);

    expect(result.code).toBe("TIMEOUT");
    expect(result.httpStatus).toBe(504);
  });

  it("'timed out' 문자열을 포함한 에러도 TIMEOUT으로 매핑되어야 한다", () => {
    const error = new Error("Connection timed out");
    const result = mapProviderError("claude", error);
    expect(result.code).toBe("TIMEOUT");
  });

  it("분류되지 않은 일반 에러는 PROVIDER_ERROR로 매핑되어야 한다", () => {
    // 특정 패턴 없는 일반 에러
    const error = new Error("Unknown service error occurred");
    const result = mapProviderError("chatgpt", error);

    expect(result.code).toBe("PROVIDER_ERROR");
    expect(result.provider).toBe("chatgpt");
  });

  it("Error 인스턴스가 아닌 값은 기본 PROVIDER_ERROR로 반환해야 한다", () => {
    // 문자열, null 등 Error가 아닌 값 처리
    const result = mapProviderError("gemini", "string error");
    expect(result.code).toBe("PROVIDER_ERROR");
    expect(result.provider).toBe("gemini");
  });
});
