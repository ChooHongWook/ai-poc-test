// Google Gemini 프로바이더 클라이언트 구현

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Part, TextPart, InlineDataPart } from "@google/generative-ai";
import type { AIProviderClient, ProviderRequest, ProviderResponse } from "@/lib/ai/types";

// @MX:NOTE: Gemini 프로바이더 - @google/generative-ai SDK를 사용하여 content 생성 API를 호출
// 시스템 인스트럭션, JSON 응답 모드, 인라인 이미지 첨부 파일을 지원함

/**
 * Google Gemini 프로바이더 클라이언트
 * @google/generative-ai 패키지의 generateContent API를 사용하여 텍스트/JSON을 생성
 */
export class GeminiProvider implements AIProviderClient {
  readonly name = "gemini" as const;

  /**
   * Google Gemini API를 호출하여 텍스트 또는 JSON 응답을 생성
   *
   * @param request - 프로바이더 요청 객체 (apiKey, model, prompt, schema, files 포함)
   * @returns 프로바이더 응답 (텍스트, 파싱된 데이터, 토큰 사용량, 레이턴시 포함)
   */
  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    // 레이턴시 측정 시작
    const startTime = Date.now();

    // 요청별로 GoogleGenerativeAI 클라이언트 생성
    const genAI = new GoogleGenerativeAI(request.apiKey);

    // 생성 설정: JSON 스키마가 있으면 JSON 응답 모드 활성화
    const generationConfig: Record<string, unknown> = {};
    if (request.schema) {
      generationConfig["responseMimeType"] = "application/json";
      generationConfig["responseSchema"] = request.schema;
    }

    // 모델 초기화 (시스템 인스트럭션 + 생성 설정 포함)
    const model = genAI.getGenerativeModel({
      model: request.model,
      systemInstruction: request.systemPrompt,
      ...(Object.keys(generationConfig).length > 0
        ? { generationConfig }
        : {}),
    });

    // 사용자 콘텐츠 파트 배열 구성 (텍스트 + 인라인 이미지)
    const parts: Part[] = [];

    // 기본 텍스트 파트 구성
    let textContent = request.userPrompt;

    // 입력 필드가 있으면 텍스트에 추가
    if (request.inputFields && request.inputFields.length > 0) {
      const fieldsText = request.inputFields
        .map((f) => `${f.label}: ${f.value}`)
        .join("\n");
      textContent += `\n\n입력 데이터:\n${fieldsText}`;
    }

    // JSON 스키마가 없는 경우 출력 형식 지시를 텍스트에 추가
    if (request.schema && Object.keys(generationConfig).length === 0) {
      textContent += `\n\n출력 형식: 다음 JSON 스키마에 맞는 유효한 JSON으로만 응답해주세요:\n${JSON.stringify(request.schema, null, 2)}`;
    }

    const textPart: TextPart = { text: textContent };
    parts.push(textPart);

    // 이미지 파일이 있으면 inlineData 파트로 추가
    if (request.files && request.files.length > 0) {
      for (const file of request.files) {
        if (file.mimeType.startsWith("image/")) {
          // Gemini는 inlineData 방식으로 이미지를 처리
          const inlineDataPart: InlineDataPart = {
            inlineData: {
              mimeType: file.mimeType,
              data: file.base64Data,
            },
          };
          parts.push(inlineDataPart);
        }
      }
    }

    // Gemini generateContent API 호출
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    });

    const response = result.response;

    // 응답 텍스트 추출
    const rawText = response.text();

    // 토큰 사용량 추출 (Gemini 방식 필드명)
    const usage = {
      promptTokenCount: response.usageMetadata?.promptTokenCount,
      candidatesTokenCount: response.usageMetadata?.candidatesTokenCount,
    };

    // JSON 스키마가 있으면 응답을 파싱하여 구조화된 데이터로 변환
    let data: Record<string, unknown>;
    if (request.schema) {
      try {
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        // 파싱 실패 시 rawText를 result 키로 래핑
        data = { result: rawText };
      }
    } else {
      data = { result: rawText };
    }

    const latencyMs = Date.now() - startTime;

    return {
      provider: this.name,
      model: request.model,
      data,
      rawText,
      usage,
      latencyMs,
    };
  }
}
