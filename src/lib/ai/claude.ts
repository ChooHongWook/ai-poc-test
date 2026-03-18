// Anthropic Claude 프로바이더 클라이언트 구현

import Anthropic from "@anthropic-ai/sdk";
import type { AIProviderClient, ProviderRequest, ProviderResponse } from "@/lib/ai/types";

// @MX:NOTE: Claude 프로바이더 - @anthropic-ai/sdk를 사용하여 Messages API를 호출
// 시스템 프롬프트, 이미지/PDF 첨부 파일, JSON 스키마 응답을 지원함

/**
 * Anthropic Claude 프로바이더 클라이언트
 * @anthropic-ai/sdk 패키지의 messages.create API를 사용하여 텍스트/JSON을 생성
 */
export class ClaudeProvider implements AIProviderClient {
  readonly name = "claude" as const;

  /**
   * Anthropic Messages API를 호출하여 텍스트 또는 JSON 응답을 생성
   *
   * @param request - 프로바이더 요청 객체 (apiKey, model, prompt, schema, files 포함)
   * @returns 프로바이더 응답 (텍스트, 파싱된 데이터, 토큰 사용량, 레이턴시 포함)
   */
  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    // 레이턴시 측정 시작
    const startTime = Date.now();

    // 요청별로 Anthropic 클라이언트 생성
    const anthropic = new Anthropic({
      apiKey: request.apiKey,
    });

    // 사용자 콘텐츠 블록 배열 구성 (텍스트 + 이미지/문서)
    const contentBlocks: Anthropic.MessageParam["content"] = [];

    // 이미지 및 PDF 파일 블록을 먼저 추가 (Claude는 파일 → 텍스트 순서를 권장)
    if (request.files && request.files.length > 0) {
      for (const file of request.files) {
        if (file.mimeType.startsWith("image/")) {
          // 이미지 파일: image 타입으로 처리
          const imageMediaType = file.mimeType as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp";
          contentBlocks.push({
            type: "image",
            source: {
              type: "base64",
              media_type: imageMediaType,
              data: file.base64Data,
            },
          });
        } else if (file.mimeType === "application/pdf") {
          // PDF 파일: document 타입으로 처리 (Claude 네이티브 PDF 지원)
          contentBlocks.push({
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: file.base64Data,
            },
          } as unknown as Anthropic.TextBlockParam);
        }
      }
    }

    // 기본 텍스트 콘텐츠 구성
    let userTextContent = request.userPrompt;

    // 입력 필드가 있으면 텍스트에 추가
    if (request.inputFields && request.inputFields.length > 0) {
      const fieldsText = request.inputFields
        .map((f) => `${f.label}: ${f.value}`)
        .join("\n");
      userTextContent += `\n\n입력 데이터:\n${fieldsText}`;
    }

    // 텍스트 블록 추가
    contentBlocks.push({
      type: "text",
      text: userTextContent,
    });

    // 시스템 프롬프트 구성: JSON 스키마가 있으면 JSON 응답 지시 추가
    let systemPrompt = request.systemPrompt;
    if (request.schema) {
      systemPrompt += `\n\n다음 JSON 스키마에 맞는 JSON으로만 응답해주세요: ${JSON.stringify(request.schema)}`;
    }

    // Anthropic Messages API 호출
    const message = await anthropic.messages.create({
      model: request.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: contentBlocks,
        },
      ],
    });

    // 응답 텍스트 추출 (첫 번째 텍스트 블록)
    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && textBlock.type === "text" ? textBlock.text : "";

    // 토큰 사용량 추출 (Anthropic 방식 필드명)
    const usage = {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    };

    // JSON 스키마가 있으면 응답을 파싱하여 구조화된 데이터로 변환
    let data: Record<string, unknown>;
    if (request.schema) {
      try {
        // Claude는 JSON을 반환하기 전에 설명 텍스트를 추가할 수 있으므로
        // JSON 블록을 추출하여 파싱 시도
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : rawText;
        data = JSON.parse(jsonString) as Record<string, unknown>;
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
