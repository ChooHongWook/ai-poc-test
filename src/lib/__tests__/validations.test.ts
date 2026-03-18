// Zod 유효성 검사 스키마 단위 테스트
import { describe, it, expect } from "vitest";
import {
  generateRequestConfigSchema,
  validateSchemaRequestSchema,
} from "../validations";

// 유효한 기본 요청 설정 (테스트 공통 픽스처)
const validConfig = {
  systemPrompt: "시스템 프롬프트입니다",
  userPrompt: "사용자 프롬프트입니다",
  providers: {
    chatgpt: { enabled: true, apiKey: "sk-test-key", model: "gpt-4o" },
    gemini: { enabled: false, apiKey: "", model: "gemini-pro" },
    claude: { enabled: false, apiKey: "", model: "claude-3" },
  },
};

describe("generateRequestConfigSchema", () => {
  it("유효한 요청 설정은 파싱을 통과해야 한다", () => {
    // 유효한 설정은 에러 없이 파싱되어야 함
    const result = generateRequestConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("systemPrompt가 빈 문자열이면 거부해야 한다", () => {
    // 빈 문자열은 trim 후 min(1) 조건 위반
    const result = generateRequestConfigSchema.safeParse({
      ...validConfig,
      systemPrompt: "",
    });
    expect(result.success).toBe(false);
  });

  it("systemPrompt가 10,000자를 초과하면 거부해야 한다", () => {
    // 10,001자 문자열 생성
    const longPrompt = "a".repeat(10_001);
    const result = generateRequestConfigSchema.safeParse({
      ...validConfig,
      systemPrompt: longPrompt,
    });
    expect(result.success).toBe(false);
  });

  it("userPrompt가 50,000자를 초과하면 거부해야 한다", () => {
    // 50,001자 문자열 생성
    const longPrompt = "a".repeat(50_001);
    const result = generateRequestConfigSchema.safeParse({
      ...validConfig,
      userPrompt: longPrompt,
    });
    expect(result.success).toBe(false);
  });

  it("활성화된 프로바이더가 없으면 거부해야 한다", () => {
    // 모든 프로바이더 비활성화
    const result = generateRequestConfigSchema.safeParse({
      ...validConfig,
      providers: {
        chatgpt: { enabled: false, apiKey: "", model: "gpt-4o" },
        gemini: { enabled: false, apiKey: "", model: "gemini-pro" },
        claude: { enabled: false, apiKey: "", model: "claude-3" },
      },
    });
    expect(result.success).toBe(false);
  });

  it("활성화된 프로바이더에 빈 apiKey가 있으면 거부해야 한다", () => {
    // enabled는 true지만 apiKey가 공백만 있는 경우
    const result = generateRequestConfigSchema.safeParse({
      ...validConfig,
      providers: {
        chatgpt: { enabled: true, apiKey: "   ", model: "gpt-4o" },
        gemini: { enabled: false, apiKey: "", model: "gemini-pro" },
        claude: { enabled: false, apiKey: "", model: "claude-3" },
      },
    });
    expect(result.success).toBe(false);
  });

  it("schema 필드에 유효한 JSON 문자열이 있으면 통과해야 한다", () => {
    // 유효한 JSON 스키마
    const result = generateRequestConfigSchema.safeParse({
      ...validConfig,
      schema: JSON.stringify({ type: "object", properties: { name: { type: "string" } } }),
    });
    expect(result.success).toBe(true);
  });

  it("schema 필드에 잘못된 JSON 문자열이 있으면 거부해야 한다", () => {
    // 유효하지 않은 JSON 문자열
    const result = generateRequestConfigSchema.safeParse({
      ...validConfig,
      schema: "{ invalid json }",
    });
    expect(result.success).toBe(false);
  });

  it("inputFields의 label이 100자를 초과하면 거부해야 한다", () => {
    // label이 101자인 inputField
    const result = generateRequestConfigSchema.safeParse({
      ...validConfig,
      inputFields: [
        { id: "field1", label: "a".repeat(101), value: "값" },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("validateSchemaRequestSchema", () => {
  it("유효한 JSON 스키마 문자열은 통과해야 한다", () => {
    // 유효한 JSON 스키마
    const result = validateSchemaRequestSchema.safeParse({
      schema: JSON.stringify({ type: "object" }),
    });
    expect(result.success).toBe(true);
  });

  it("빈 schema 문자열은 거부해야 한다", () => {
    // 빈 문자열은 min(1) 조건 위반
    const result = validateSchemaRequestSchema.safeParse({ schema: "" });
    expect(result.success).toBe(false);
  });
});
