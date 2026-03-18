// Zod 유효성 검사 스키마 정의
import { z } from "zod";

// 프로바이더 이름 스키마
const providerNameSchema = z.enum(["chatgpt", "gemini", "claude"]);

// 입력 필드 스키마
const inputFieldSchema = z.object({
  id: z.string().min(1),
  // 레이블 최대 100자
  label: z.string().max(100),
  // 필드 값 최대 10,000자
  value: z.string().max(10_000),
});

// AI 프로바이더 설정 스키마
const aiProviderConfigSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string(),
  model: z.string(),
});

// AI 생성 요청 설정 스키마 (메인 요청 유효성 검사)
export const generateRequestConfigSchema = z
  .object({
    // 시스템 프롬프트: 최소 1자, 최대 10,000자, 앞뒤 공백 제거
    systemPrompt: z.string().min(1).max(10_000).trim(),
    // 사용자 프롬프트: 최소 1자, 최대 50,000자, 앞뒤 공백 제거
    userPrompt: z.string().min(1).max(50_000).trim(),
    // JSON 스키마: 선택적, 유효한 JSON 문자열이어야 함
    schema: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (val === undefined || val === "") return true;
          try {
            JSON.parse(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: "유효한 JSON 형식이어야 합니다" }
      ),
    // 입력 필드: 선택적 배열
    inputFields: z.array(inputFieldSchema).optional(),
    // 프로바이더 설정 (모든 프로바이더 포함)
    providers: z.record(providerNameSchema, aiProviderConfigSchema),
  })
  .refine(
    (data) => {
      // 최소 하나의 프로바이더가 활성화되고 API 키가 있어야 함
      return Object.values(data.providers).some(
        (p) => p.enabled && p.apiKey.trim().length > 0
      );
    },
    {
      message: "최소 하나의 프로바이더가 활성화되고 유효한 API 키를 가져야 합니다",
      path: ["providers"],
    }
  );

// 스키마 유효성 검사 엔드포인트 입력 스키마
export const validateSchemaRequestSchema = z.object({
  // 검사할 JSON 스키마 문자열
  schema: z
    .string()
    .min(1, "스키마가 비어 있습니다")
    .refine(
      (val) => {
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "유효한 JSON 형식이어야 합니다" }
    ),
});

// Zod 스키마에서 파생된 TypeScript 타입들
export type GenerateRequestConfigInput = z.input<typeof generateRequestConfigSchema>;
export type GenerateRequestConfigOutput = z.output<typeof generateRequestConfigSchema>;
export type ValidateSchemaRequestInput = z.input<typeof validateSchemaRequestSchema>;
