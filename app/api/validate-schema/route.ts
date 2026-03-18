// JSON 스키마 유효성 검사 API 라우트 핸들러

import { NextRequest, NextResponse } from "next/server";
import { validateSchemaRequestSchema } from "@/lib/validations";
import { createErrorResponse } from "@/lib/errors";

/**
 * POST /api/validate-schema
 * JSON 스키마 문자열의 유효성을 검사하는 엔드포인트
 *
 * 요청 바디: { schema: string }
 * 응답: { valid: true, parsed: object } | { valid: false, error: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 요청 바디 파싱
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // JSON 파싱 실패 시 400 에러 반환
    return NextResponse.json(
      createErrorResponse("VALIDATION_ERROR", "요청 바디가 올바른 JSON 형식이 아닙니다"),
      { status: 400 }
    );
  }

  // validateSchemaRequestSchema를 이용한 입력 유효성 검사
  const validationResult = validateSchemaRequestSchema.safeParse(body);
  if (!validationResult.success) {
    // Zod 유효성 검사 실패 시 400 에러 반환
    return NextResponse.json(
      createErrorResponse(
        "VALIDATION_ERROR",
        "입력 유효성 검사 실패",
        validationResult.error.flatten()
      ),
      { status: 400 }
    );
  }

  const { schema } = validationResult.data;

  // JSON 파싱 시도
  try {
    const parsed = JSON.parse(schema) as Record<string, unknown>;
    // 유효한 JSON인 경우 파싱된 객체와 함께 응답
    return NextResponse.json({ valid: true, parsed }, { status: 200 });
  } catch (error) {
    // JSON 파싱 실패 시 오류 메시지와 함께 응답 (HTTP 200, valid: false)
    const message =
      error instanceof Error ? error.message : "JSON 파싱에 실패했습니다";
    return NextResponse.json({ valid: false, error: message }, { status: 200 });
  }
}
