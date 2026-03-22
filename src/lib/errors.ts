// 에러 유틸리티 모듈
import type {
  APIErrorResponse,
  ErrorCode,
  ProviderError,
  ProviderName,
} from './types';

// 에러 코드별 한국어 메시지 맵
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: '요청 데이터가 유효하지 않습니다',
  MISSING_API_KEY: 'API 키가 유효하지 않습니다',
  INVALID_SCHEMA: 'JSON 스키마 형식이 올바르지 않습니다',
  PROVIDER_ERROR: 'AI 서비스에 일시적인 오류가 발생했습니다',
  RATE_LIMIT_EXCEEDED: '요청 한도를 초과했습니다',
  TIMEOUT: '응답 시간이 초과되었습니다',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다',
  UNSUPPORTED_FILE_TYPE: '지원하지 않는 파일 형식입니다',
  INTERNAL_ERROR: '서버 오류가 발생했습니다',
};

// 에러 코드별 HTTP 상태 코드 맵
const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  MISSING_API_KEY: 401,
  INVALID_SCHEMA: 400,
  PROVIDER_ERROR: 502,
  RATE_LIMIT_EXCEEDED: 429,
  TIMEOUT: 504,
  FILE_TOO_LARGE: 413,
  UNSUPPORTED_FILE_TYPE: 415,
  INTERNAL_ERROR: 500,
};

// 애플리케이션 커스텀 에러 클래스
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    // 메시지가 없으면 한국어 기본 메시지 사용
    super(message ?? ERROR_MESSAGES[code]);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = ERROR_STATUS_CODES[code];
    this.details = details;
  }
}

// API 에러 응답 객체 생성 헬퍼 함수
export function createErrorResponse(
  code: ErrorCode,
  message?: string,
  details?: unknown,
): APIErrorResponse {
  return {
    success: false,
    error: code,
    message: message ?? ERROR_MESSAGES[code],
    details,
  };
}

// 에러 코드로 한국어 메시지 조회
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code];
}

// 에러 코드로 HTTP 상태 코드 조회
export function getStatusCode(code: ErrorCode): number {
  return ERROR_STATUS_CODES[code];
}

// 프로바이더 SDK 에러를 공통 ProviderError 형식으로 정규화
export function mapProviderError(
  provider: ProviderName,
  error: unknown,
): ProviderError {
  // 기본 에러 구조
  const baseError: ProviderError = {
    provider,
    code: 'PROVIDER_ERROR',
    message: ERROR_MESSAGES.PROVIDER_ERROR,
  };

  if (!(error instanceof Error)) {
    return baseError;
  }

  const message = error.message ?? ERROR_MESSAGES.PROVIDER_ERROR;

  // HTTP 상태 코드 추출 시도 (SDK마다 프로퍼티 이름이 다름)
  const anyError = error as unknown as Record<string, unknown>;
  const httpStatus =
    typeof anyError['status'] === 'number'
      ? anyError['status']
      : typeof anyError['statusCode'] === 'number'
        ? anyError['statusCode']
        : undefined;

  // 레이트 리밋 에러 감지
  if (httpStatus === 429 || message.toLowerCase().includes('rate limit')) {
    return {
      ...baseError,
      code: 'RATE_LIMIT_EXCEEDED',
      message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
      httpStatus: 429,
    };
  }

  // 인증 에러 감지
  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    message.toLowerCase().includes('api key') ||
    message.toLowerCase().includes('authentication') ||
    message.toLowerCase().includes('unauthorized')
  ) {
    return {
      ...baseError,
      code: 'MISSING_API_KEY',
      message: ERROR_MESSAGES.MISSING_API_KEY,
      httpStatus,
    };
  }

  // 타임아웃 에러 감지
  if (
    message.toLowerCase().includes('timeout') ||
    message.toLowerCase().includes('timed out')
  ) {
    return {
      ...baseError,
      code: 'TIMEOUT',
      message: ERROR_MESSAGES.TIMEOUT,
      httpStatus: 504,
    };
  }

  // 일반 프로바이더 에러
  return {
    ...baseError,
    message,
    httpStatus,
  };
}
