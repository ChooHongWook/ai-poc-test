// AI 프로바이더 클라이언트 인터페이스 정의

import type { ProviderName, TokenUsage } from "@/lib/types";

// 프로바이더 요청 인터페이스
export interface ProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  apiKey: string;
  schema?: object;
  inputFields?: { label: string; value: string }[];
  files?: ProcessedFile[];
}

// 처리된 파일 정보
export interface ProcessedFile {
  name: string;
  mimeType: string;
  base64Data: string;
  textContent?: string;
}

// 프로바이더 응답 인터페이스
export interface ProviderResponse {
  provider: ProviderName;
  model: string;
  data: Record<string, unknown>;
  rawText: string;
  usage: TokenUsage;
  latencyMs: number;
}

// AI 프로바이더 클라이언트 인터페이스
export interface AIProviderClient {
  name: ProviderName;
  generate(request: ProviderRequest): Promise<ProviderResponse>;
}
