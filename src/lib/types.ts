// AI 프로바이더 관련 타입 정의

// 지원하는 AI 프로바이더 이름 타입
export type ProviderName = 'chatgpt' | 'gemini' | 'claude';

// 사용자 입력 필드 타입
export interface InputField {
  id: string;
  label: string;
  value: string;
}

// AI 프로바이더 설정 타입
export interface AIProviderConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
}

// AI 생성 요청 설정 타입
export interface GenerateRequestConfig {
  systemPrompt: string;
  userPrompt: string;
  schema?: string;
  inputFields?: InputField[];
  providers: Record<ProviderName, AIProviderConfig>;
}

// 토큰 사용량 타입 (프로바이더별 필드명 다양성을 고려하여 선택적으로 정의)
export interface TokenUsage {
  // OpenAI 방식
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  // Google Gemini 방식
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  // Anthropic Claude 방식
  inputTokens?: number;
  outputTokens?: number;
}

// 프로바이더 성공 결과 타입
export interface ProviderResult {
  provider: ProviderName;
  model: string;
  data: Record<string, unknown>;
  rawText: string;
  usage: TokenUsage;
  latencyMs: number;
}

// 프로바이더 오류 타입
export interface ProviderError {
  provider: ProviderName;
  code: string;
  message: string;
  httpStatus?: number;
}

// AI 생성 응답 타입 (전체 결과)
export interface GenerateResponse {
  success: boolean;
  results: Record<ProviderName, ProviderResult | null>;
  errors: Record<ProviderName, ProviderError | null>;
}

// API 에러 응답 타입
export interface APIErrorResponse {
  success: false;
  error: ErrorCode;
  message: string;
  details?: unknown;
}

// 에러 코드 유니온 타입
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'MISSING_API_KEY'
  | 'INVALID_SCHEMA'
  | 'PROVIDER_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TIMEOUT'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'INTERNAL_ERROR';
