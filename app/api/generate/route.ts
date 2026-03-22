// AI 생성 API 라우트 핸들러 (메인 엔드포인트)

import { NextRequest, NextResponse } from 'next/server';
import { generateRequestConfigSchema } from '@/lib/validations';
import { createErrorResponse, mapProviderError } from '@/lib/errors';
import { createProvider } from '@/lib/ai/provider-factory';
import type { ProviderRequest, ProcessedFile } from '@/lib/ai/types';
import type {
  GenerateRequestConfig,
  GenerateResponse,
  ProviderName,
  ProviderResult,
  ProviderError,
} from '@/lib/types';

// @MX:ANCHOR: AI 생성 엔드포인트 - 다수의 프로바이더를 병렬로 호출하는 핵심 API
// @MX:REASON: 프론트엔드와 계약이 맺어진 공개 API 경계로, 변경 시 프론트엔드 연동에 영향을 미침

/**
 * File 객체를 ProcessedFile 형식으로 변환하는 헬퍼 함수
 *
 * @param file - 브라우저 File 객체
 * @returns ProcessedFile 형식 (base64 인코딩 포함)
 */
async function convertToProcessedFile(file: File): Promise<ProcessedFile> {
  // File을 ArrayBuffer로 읽어 base64 문자열로 변환
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Node.js 환경에서 base64 변환
  const base64Data = Buffer.from(uint8Array).toString('base64');

  return {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64Data,
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
        'VALIDATION_ERROR',
        'multipart/form-data 파싱에 실패했습니다',
      ),
      { status: 400 },
    );
  }

  // config 필드 추출 (JSON 문자열)
  const configRaw = formData.get('config');
  if (typeof configRaw !== 'string' || configRaw.trim().length === 0) {
    return NextResponse.json(
      createErrorResponse('VALIDATION_ERROR', 'config 필드가 누락되었습니다'),
      { status: 400 },
    );
  }

  // config JSON 파싱
  let configParsed: unknown;
  try {
    configParsed = JSON.parse(configRaw);
  } catch {
    return NextResponse.json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'config 필드가 올바른 JSON 형식이 아닙니다',
      ),
      { status: 400 },
    );
  }

  // Zod 스키마를 통한 config 유효성 검사
  const configValidation = generateRequestConfigSchema.safeParse(configParsed);
  if (!configValidation.success) {
    return NextResponse.json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'config 유효성 검사 실패',
        configValidation.error.flatten(),
      ),
      { status: 400 },
    );
  }

  const config: GenerateRequestConfig = configValidation.data;

  // 첨부 파일을 ProcessedFile 형식으로 변환
  const rawFiles = formData
    .getAll('files')
    .filter((item): item is File => item instanceof File);

  let processedFiles: ProcessedFile[] = [];
  if (rawFiles.length > 0) {
    processedFiles = await Promise.all(
      rawFiles.map((file) => convertToProcessedFile(file)),
    );
  }

  // 활성화된 프로바이더 목록 추출
  const enabledProviders = (
    Object.entries(config.providers) as [
      ProviderName,
      { enabled: boolean; apiKey: string; model: string },
    ][]
  ).filter(
    ([, providerConfig]) =>
      providerConfig.enabled && providerConfig.apiKey.trim().length > 0,
  );

  if (enabledProviders.length === 0) {
    return NextResponse.json(
      createErrorResponse('VALIDATION_ERROR', '활성화된 프로바이더가 없습니다'),
      { status: 400 },
    );
  }

  // JSON 스키마 파싱 (있는 경우)
  let parsedSchema: object | undefined;
  if (config.schema) {
    try {
      parsedSchema = JSON.parse(config.schema) as object;
    } catch {
      // 유효성 검사를 이미 통과했으므로 파싱 실패는 예외적인 상황
      parsedSchema = undefined;
    }
  }

  // 모든 프로바이더를 병렬로 호출 (부분 실패 허용)
  const settledResults = await Promise.allSettled(
    enabledProviders.map(([providerName, providerConfig]) => {
      // 팩토리를 통해 프로바이더 인스턴스 생성
      const provider = createProvider(providerName);

      // ProviderRequest 객체 구성
      const providerRequest: ProviderRequest = {
        systemPrompt: config.systemPrompt,
        userPrompt: config.userPrompt,
        model: providerConfig.model,
        apiKey: providerConfig.apiKey,
        ...(parsedSchema ? { schema: parsedSchema } : {}),
        ...(config.inputFields ? { inputFields: config.inputFields } : {}),
        ...(processedFiles.length > 0 ? { files: processedFiles } : {}),
      };

      return provider.generate(providerRequest);
    }),
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

    if (settled.status === 'fulfilled') {
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
