// AI 생성 API 라우트 핸들러 (메인 엔드포인트)

import { NextRequest, NextResponse } from "next/server";
import { generateRequestConfigSchema } from "@/lib/validations";
import { createErrorResponse, mapProviderError } from "@/lib/errors";
import type {
  GenerateRequestConfig,
  GenerateResponse,
  ProviderName,
  ProviderResult,
  ProviderError,
  TokenUsage,
} from "@/lib/types";

// @MX:ANCHOR: AI 생성 엔드포인트 - 다수의 프로바이더를 병렬로 호출하는 핵심 API
// @MX:REASON: 프론트엔드와 계약이 맺어진 공개 API 경계로, 변경 시 프론트엔드 연동에 영향을 미침

// 각 프로바이더별 모의 응답 딜레이 설정 (실제 API 호출 지연 시뮬레이션)
const MOCK_DELAY_MS = 500;

/**
 * 프로바이더별 모의 데이터를 생성하는 헬퍼 함수
 * 실제 프로바이더마다 약간 다른 응답 형태를 시뮬레이션함
 */
function buildMockData(
  provider: ProviderName,
  schema: object | undefined
): Record<string, unknown> {
  // 스키마가 있으면 스키마 기반으로 목 데이터 생성
  if (schema && typeof schema === "object" && "properties" in schema) {
    const properties = (schema as { properties: Record<string, unknown> }).properties;
    const mockData: Record<string, unknown> = {};

    for (const [key] of Object.entries(properties)) {
      // 각 프로바이더별로 약간 다른 목 값 반환
      switch (provider) {
        case "chatgpt":
          mockData[key] = `[ChatGPT] ${key} 샘플 데이터`;
          break;
        case "gemini":
          mockData[key] = `[Gemini] ${key} 예시 결과`;
          break;
        case "claude":
          mockData[key] = `[Claude] ${key} 생성 내용`;
          break;
      }
    }
    return mockData;
  }

  // 스키마 없이 기본 텍스트 필드 응답
  switch (provider) {
    case "chatgpt":
      return {
        title: "ChatGPT가 생성한 제목",
        description: "ChatGPT가 생성한 상세 설명입니다. 자연스러운 한국어 문장으로 구성됩니다.",
        summary: "ChatGPT 요약 내용",
      };
    case "gemini":
      return {
        title: "Gemini가 생성한 제목",
        description: "Gemini가 생성한 상세 설명입니다. 다양한 표현을 활용하여 작성됩니다.",
        summary: "Gemini 요약 내용",
      };
    case "claude":
      return {
        title: "Claude가 생성한 제목",
        description: "Claude가 생성한 상세 설명입니다. 정확하고 간결한 표현을 사용합니다.",
        summary: "Claude 요약 내용",
      };
  }
}

/**
 * 프로바이더별 모의 토큰 사용량 생성
 * 실제 SDK에서 반환하는 필드명 차이를 시뮬레이션함
 */
function buildMockTokenUsage(provider: ProviderName): TokenUsage {
  switch (provider) {
    case "chatgpt":
      // OpenAI 방식 필드명
      return {
        promptTokens: 120 + Math.floor(Math.random() * 50),
        completionTokens: 200 + Math.floor(Math.random() * 100),
        totalTokens: 320 + Math.floor(Math.random() * 150),
      };
    case "gemini":
      // Google Gemini 방식 필드명
      return {
        promptTokenCount: 115 + Math.floor(Math.random() * 50),
        candidatesTokenCount: 195 + Math.floor(Math.random() * 100),
      };
    case "claude":
      // Anthropic Claude 방식 필드명
      return {
        inputTokens: 118 + Math.floor(Math.random() * 50),
        outputTokens: 205 + Math.floor(Math.random() * 100),
      };
  }
}

/**
 * 단일 프로바이더에 대한 AI 생성 함수
 *
 * @param provider - 호출할 AI 프로바이더 이름
 * @param config - 프로바이더 설정 (API 키, 모델 등)
 * @param request - 생성 요청 설정 (프롬프트, 스키마 등)
 * @returns 프로바이더 결과 객체
 *
 * TODO: 실제 SDK 호출로 교체 필요
 * - chatgpt: openai 패키지의 OpenAI 클라이언트 사용
 * - gemini: @google/generative-ai 패키지의 GoogleGenerativeAI 클라이언트 사용
 * - claude: @anthropic-ai/sdk 패키지의 Anthropic 클라이언트 사용
 */
async function generateWithProvider(
  provider: ProviderName,
  config: { apiKey: string; model: string },
  request: GenerateRequestConfig
): Promise<ProviderResult> {
  const startTime = Date.now();

  // TODO: 실제 API 호출로 교체 - 현재는 모의 응답을 500ms 후 반환
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  // 스키마 파싱 (있는 경우)
  let parsedSchema: object | undefined;
  if (request.schema) {
    try {
      parsedSchema = JSON.parse(request.schema) as object;
    } catch {
      // 스키마 파싱 실패 시 무시하고 기본 응답 사용
      parsedSchema = undefined;
    }
  }

  // 모의 응답 데이터 생성
  const mockData = buildMockData(provider, parsedSchema);
  const mockRawText = JSON.stringify(mockData, null, 2);
  const mockUsage = buildMockTokenUsage(provider);
  const latencyMs = Date.now() - startTime;

  return {
    provider,
    model: config.model,
    data: mockData,
    rawText: mockRawText,
    usage: mockUsage,
    latencyMs,
  };
}

// @MX:ANCHOR: POST 핸들러 - multipart/form-data 파싱 및 병렬 프로바이더 호출
// @MX:REASON: Next.js App Router의 공개 엔드포인트로 프론트엔드와의 계약 지점

/**
 * POST /api/generate
 * 복수의 AI 프로바이더를 병렬로 호출하여 결과를 집계하는 메인 엔드포인트
 *
 * 요청: multipart/form-data
 *   - config: JSON 문자열 (GenerateRequestConfig 형식)
 *   - files: 첨부 파일 목록 (선택적)
 *
 * 응답: GenerateResponse
 *   - 전체 성공: 200
 *   - 부분 성공 (일부 프로바이더 실패): 207
 *   - 전체 실패: 500
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // multipart/form-data 파싱
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      createErrorResponse(
        "VALIDATION_ERROR",
        "multipart/form-data 파싱에 실패했습니다"
      ),
      { status: 400 }
    );
  }

  // config 필드 추출 (JSON 문자열)
  const configRaw = formData.get("config");
  if (typeof configRaw !== "string" || configRaw.trim().length === 0) {
    return NextResponse.json(
      createErrorResponse("VALIDATION_ERROR", "config 필드가 누락되었습니다"),
      { status: 400 }
    );
  }

  // config JSON 파싱
  let configParsed: unknown;
  try {
    configParsed = JSON.parse(configRaw);
  } catch {
    return NextResponse.json(
      createErrorResponse(
        "VALIDATION_ERROR",
        "config 필드가 올바른 JSON 형식이 아닙니다"
      ),
      { status: 400 }
    );
  }

  // Zod 스키마를 통한 config 유효성 검사
  const configValidation = generateRequestConfigSchema.safeParse(configParsed);
  if (!configValidation.success) {
    return NextResponse.json(
      createErrorResponse(
        "VALIDATION_ERROR",
        "config 유효성 검사 실패",
        configValidation.error.flatten()
      ),
      { status: 400 }
    );
  }

  const config = configValidation.data;

  // 첨부 파일 추출 (현재는 파일 목록 수집만 수행, 실제 처리는 추후 구현)
  // TODO: 파일을 ProcessedFile 형식으로 변환하여 프로바이더에 전달
  const _files = formData.getAll("files").filter(
    (item): item is File => item instanceof File
  );

  // 활성화된 프로바이더 목록 추출
  const enabledProviders = (
    Object.entries(config.providers) as [ProviderName, { enabled: boolean; apiKey: string; model: string }][]
  ).filter(([, providerConfig]) => providerConfig.enabled && providerConfig.apiKey.trim().length > 0);

  if (enabledProviders.length === 0) {
    return NextResponse.json(
      createErrorResponse(
        "VALIDATION_ERROR",
        "활성화된 프로바이더가 없습니다"
      ),
      { status: 400 }
    );
  }

  // 모든 프로바이더를 병렬로 호출 (부분 실패 허용)
  const settledResults = await Promise.allSettled(
    enabledProviders.map(([providerName, providerConfig]) =>
      generateWithProvider(providerName, providerConfig, config)
    )
  );

  // 결과 및 오류 집계
  const results: Record<ProviderName, ProviderResult | null> = {
    chatgpt: null,
    gemini: null,
    claude: null,
  };
  const errors: Record<ProviderName, ProviderError | null> = {
    chatgpt: null,
    gemini: null,
    claude: null,
  };

  let successCount = 0;
  let failureCount = 0;

  settledResults.forEach((settled, index) => {
    const [providerName] = enabledProviders[index];

    if (settled.status === "fulfilled") {
      results[providerName] = settled.value;
      successCount++;
    } else {
      // 프로바이더 오류를 공통 형식으로 정규화
      errors[providerName] = mapProviderError(providerName, settled.reason);
      failureCount++;
    }
  });

  const response: GenerateResponse = {
    success: failureCount === 0,
    results,
    errors,
  };

  // HTTP 상태 코드 결정
  // - 전체 실패: 500
  // - 부분 실패: 207 (Multi-Status)
  // - 전체 성공: 200
  if (successCount === 0) {
    return NextResponse.json(response, { status: 500 });
  }

  if (failureCount > 0) {
    return NextResponse.json(response, { status: 207 });
  }

  return NextResponse.json(response, { status: 200 });
}
