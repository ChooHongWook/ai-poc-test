// OpenAI ChatGPT 프로바이더 클라이언트 구현

import OpenAI from 'openai';
import type {
  AIProviderClient,
  ProviderRequest,
  ProviderResponse,
} from '@/lib/ai/types';

// @MX:NOTE: ChatGPT 프로바이더 - OpenAI SDK를 사용하여 chat completions API를 호출
// JSON 스키마 모드와 이미지 첨부 파일을 지원함

/**
 * OpenAI ChatGPT 프로바이더 클라이언트
 * openai 패키지의 chat.completions.create API를 사용하여 텍스트/JSON을 생성
 */
export class ChatGPTProvider implements AIProviderClient {
  readonly name = 'chatgpt' as const;

  /**
   * OpenAI API를 호출하여 텍스트 또는 JSON 응답을 생성
   *
   * @param request - 프로바이더 요청 객체 (apiKey, model, prompt, schema, files 포함)
   * @returns 프로바이더 응답 (텍스트, 파싱된 데이터, 토큰 사용량, 레이턴시 포함)
   */
  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    // 레이턴시 측정 시작
    const startTime = Date.now();

    // 요청별로 OpenAI 클라이언트 생성 (API 키는 요청마다 다를 수 있음)
    const openai = new OpenAI({
      apiKey: request.apiKey,
    });

    // 사용자 메시지 콘텐츠 배열 구성 (텍스트 + 이미지 파트)
    const userContentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
      [];

    // 기본 텍스트 파트 생성
    let userTextContent = request.userPrompt;

    // 입력 필드가 있으면 프롬프트에 추가
    if (request.inputFields && request.inputFields.length > 0) {
      const fieldsText = request.inputFields
        .map((f) => `${f.label}: ${f.value}`)
        .join('\n');
      userTextContent += `\n\n입력 데이터:\n${fieldsText}`;
    }

    // JSON 스키마가 있으면 출력 형식 지시 추가
    if (request.schema) {
      userTextContent += `\n\n출력 형식: 다음 JSON 스키마에 맞는 유효한 JSON으로만 응답해주세요:\n${JSON.stringify(request.schema, null, 2)}`;
    }

    userContentParts.push({
      type: 'text',
      text: userTextContent,
    });

    // 이미지 파일이 있으면 image_url 콘텐츠 파트로 추가
    if (request.files && request.files.length > 0) {
      for (const file of request.files) {
        // 이미지 MIME 타입만 처리 (PDF 등은 텍스트로 이미 변환됨)
        if (file.mimeType.startsWith('image/')) {
          userContentParts.push({
            type: 'image_url',
            image_url: {
              url: `data:${file.mimeType};base64,${file.base64Data}`,
              detail: 'auto',
            },
          });
        }
      }
    }

    // 메시지 배열 구성 (시스템 + 사용자)
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: request.systemPrompt,
      },
      {
        role: 'user',
        // 파트가 하나이고 텍스트만 있으면 문자열로 단순화
        content:
          userContentParts.length === 1 && userContentParts[0].type === 'text'
            ? userContentParts[0].text
            : userContentParts,
      },
    ];

    // response_format 설정: 스키마가 있으면 json_schema 모드 사용
    let responseFormat:
      | OpenAI.Chat.Completions.ChatCompletionCreateParams['response_format']
      | undefined;

    if (request.schema) {
      responseFormat = {
        type: 'json_schema',
        json_schema: {
          name: 'output',
          strict: true,
          schema: request.schema as Record<string, unknown>,
        },
      };
    }

    // OpenAI Chat Completions API 호출
    const completion = await openai.chat.completions.create({
      model: request.model,
      messages,
      max_tokens: 4096,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    });

    // 응답 텍스트 추출
    const rawText = completion.choices[0]?.message?.content ?? '';

    // 토큰 사용량 추출 (OpenAI 방식 필드명)
    const usage = {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
    };

    // JSON 스키마가 있으면 응답 텍스트를 파싱하여 구조화된 데이터로 변환
    let data: Record<string, unknown>;
    if (request.schema) {
      try {
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        // 파싱 실패 시 rawText를 result 키로 래핑
        data = { result: rawText };
      }
    } else {
      // 스키마 없으면 rawText를 result 키로 래핑
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
