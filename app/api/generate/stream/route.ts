// SSE 스트리밍 AI 생성 API 라우트 핸들러

import { NextRequest } from "next/server";
import { generateRequestConfigSchema } from "@/lib/validations";
import { createErrorResponse } from "@/lib/errors";
import type { ProviderName } from "@/lib/types";
import type { ProcessedFile } from "@/lib/ai/types";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

// @MX:ANCHOR: SSE 스트리밍 엔드포인트 - 각 프로바이더의 실시간 스트리밍 응답을 SSE로 전달
// @MX:REASON: 프론트엔드와의 스트리밍 API 계약 지점으로, 이벤트 형식 변경 시 훅 구현에 영향을 미침

/**
 * SSE 이벤트 타입 정의
 */
type SSEEventType = "delta" | "done" | "error";

/**
 * SSE 이벤트 데이터 형식
 */
interface SSEEvent {
  provider: ProviderName;
  type: SSEEventType;
  content?: string;
  field?: string;
  data?: Record<string, unknown>;
  message?: string;
}

/**
 * SSE 이벤트 문자열로 직렬화
 */
function formatSSEEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * File 객체를 ProcessedFile 형식으로 변환
 */
async function convertToProcessedFile(file: File): Promise<ProcessedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const base64Data = Buffer.from(uint8Array).toString("base64");

  return {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    base64Data,
  };
}

/**
 * OpenAI 스트리밍 - chat.completions.create에 stream: true 옵션 사용
 */
async function streamChatGPT(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  schema: object | undefined,
  inputFields: { label: string; value: string }[] | undefined,
  files: ProcessedFile[],
  controller: ReadableStreamDefaultController<Uint8Array>
): Promise<void> {
  const encoder = new TextEncoder();

  const openai = new OpenAI({ apiKey });

  // 사용자 콘텐츠 파트 구성
  const userContentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
  let userTextContent = userPrompt;

  if (inputFields && inputFields.length > 0) {
    const fieldsText = inputFields.map((f) => `${f.label}: ${f.value}`).join("\n");
    userTextContent += `\n\n입력 데이터:\n${fieldsText}`;
  }

  if (schema) {
    userTextContent += `\n\n출력 형식: 다음 JSON 스키마에 맞는 유효한 JSON으로만 응답해주세요:\n${JSON.stringify(schema, null, 2)}`;
  }

  userContentParts.push({ type: "text", text: userTextContent });

  // 이미지 파일 첨부
  for (const file of files) {
    if (file.mimeType.startsWith("image/")) {
      userContentParts.push({
        type: "image_url",
        image_url: {
          url: `data:${file.mimeType};base64,${file.base64Data}`,
          detail: "auto",
        },
      });
    }
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content:
        userContentParts.length === 1 && userContentParts[0].type === "text"
          ? userContentParts[0].text
          : userContentParts,
    },
  ];

  // response_format 설정 (스키마 있을 때)
  let responseFormat:
    | OpenAI.Chat.Completions.ChatCompletionCreateParams["response_format"]
    | undefined;
  if (schema) {
    responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "output",
        strict: true,
        schema: schema as Record<string, unknown>,
      },
    };
  }

  // 스트리밍 호출
  const stream = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: 4096,
    stream: true,
    ...(responseFormat ? { response_format: responseFormat } : {}),
  });

  let fullText = "";

  // 스트림 이터레이션
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullText += delta;
      const event: SSEEvent = {
        provider: "chatgpt",
        type: "delta",
        content: delta,
      };
      controller.enqueue(encoder.encode(formatSSEEvent(event)));
    }
  }

  // 완료 이벤트 전송 (최종 파싱 데이터 포함)
  let finalData: Record<string, unknown>;
  if (schema) {
    try {
      finalData = JSON.parse(fullText) as Record<string, unknown>;
    } catch {
      finalData = { result: fullText };
    }
  } else {
    finalData = { result: fullText };
  }

  const doneEvent: SSEEvent = {
    provider: "chatgpt",
    type: "done",
    data: finalData,
  };
  controller.enqueue(encoder.encode(formatSSEEvent(doneEvent)));
}

/**
 * Google Gemini 스트리밍 - generateContentStream() 메서드 사용
 */
async function streamGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  schema: object | undefined,
  inputFields: { label: string; value: string }[] | undefined,
  files: ProcessedFile[],
  controller: ReadableStreamDefaultController<Uint8Array>
): Promise<void> {
  const encoder = new TextEncoder();

  const genAI = new GoogleGenerativeAI(apiKey);

  // 생성 설정 구성
  const generationConfig: Record<string, unknown> = {};
  if (schema) {
    generationConfig["responseMimeType"] = "application/json";
    generationConfig["responseSchema"] = schema;
  }

  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
  });

  // 사용자 파트 구성
  let textContent = userPrompt;

  if (inputFields && inputFields.length > 0) {
    const fieldsText = inputFields.map((f) => `${f.label}: ${f.value}`).join("\n");
    textContent += `\n\n입력 데이터:\n${fieldsText}`;
  }

  // Gemini SDK의 Part 타입을 사용하여 타입 안전하게 구성
  type GeminiPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } };

  const parts: GeminiPart[] = [{ text: textContent }];

  // 이미지 파일 첨부
  for (const file of files) {
    if (file.mimeType.startsWith("image/")) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64Data,
        },
      });
    }
  }

  // 스트리밍 호출
  const streamResult = await geminiModel.generateContentStream({
    contents: [{ role: "user", parts }],
  });

  let fullText = "";

  // 스트림 이터레이션
  for await (const chunk of streamResult.stream) {
    const delta = chunk.text();
    if (delta) {
      fullText += delta;
      const event: SSEEvent = {
        provider: "gemini",
        type: "delta",
        content: delta,
      };
      controller.enqueue(encoder.encode(formatSSEEvent(event)));
    }
  }

  // 완료 이벤트 전송
  let finalData: Record<string, unknown>;
  if (schema) {
    try {
      finalData = JSON.parse(fullText) as Record<string, unknown>;
    } catch {
      finalData = { result: fullText };
    }
  } else {
    finalData = { result: fullText };
  }

  const doneEvent: SSEEvent = {
    provider: "gemini",
    type: "done",
    data: finalData,
  };
  controller.enqueue(encoder.encode(formatSSEEvent(doneEvent)));
}

/**
 * Anthropic Claude 스트리밍 - stream() 메서드 사용
 */
async function streamClaude(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  schema: object | undefined,
  inputFields: { label: string; value: string }[] | undefined,
  files: ProcessedFile[],
  controller: ReadableStreamDefaultController<Uint8Array>
): Promise<void> {
  const encoder = new TextEncoder();

  const anthropic = new Anthropic({ apiKey });

  // 콘텐츠 블록 구성
  const contentBlocks: Anthropic.MessageParam["content"] = [];

  // 이미지/PDF 파일 블록을 먼저 추가
  for (const file of files) {
    if (file.mimeType.startsWith("image/")) {
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

  // 텍스트 콘텐츠 구성
  let userTextContent = userPrompt;

  if (inputFields && inputFields.length > 0) {
    const fieldsText = inputFields.map((f) => `${f.label}: ${f.value}`).join("\n");
    userTextContent += `\n\n입력 데이터:\n${fieldsText}`;
  }

  contentBlocks.push({ type: "text", text: userTextContent });

  // 시스템 프롬프트에 JSON 스키마 지시 추가
  let finalSystemPrompt = systemPrompt;
  if (schema) {
    finalSystemPrompt += `\n\n다음 JSON 스키마에 맞는 JSON으로만 응답해주세요: ${JSON.stringify(schema)}`;
  }

  // 스트리밍 호출 - stream() 메서드 사용
  const stream = anthropic.messages.stream({
    model,
    max_tokens: 4096,
    system: finalSystemPrompt,
    messages: [{ role: "user", content: contentBlocks }],
  });

  let fullText = "";

  // 스트림 이벤트 이터레이션
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      const delta = event.delta.text;
      if (delta) {
        fullText += delta;
        const sseEvent: SSEEvent = {
          provider: "claude",
          type: "delta",
          content: delta,
        };
        controller.enqueue(encoder.encode(formatSSEEvent(sseEvent)));
      }
    }
  }

  // 완료 이벤트 전송
  let finalData: Record<string, unknown>;
  if (schema) {
    try {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : fullText;
      finalData = JSON.parse(jsonString) as Record<string, unknown>;
    } catch {
      finalData = { result: fullText };
    }
  } else {
    finalData = { result: fullText };
  }

  const doneEvent: SSEEvent = {
    provider: "claude",
    type: "done",
    data: finalData,
  };
  controller.enqueue(encoder.encode(formatSSEEvent(doneEvent)));
}

// @MX:ANCHOR: SSE 스트리밍 POST 핸들러 - 여러 프로바이더를 동일 SSE 연결에서 독립적으로 스트리밍
// @MX:REASON: 프론트엔드 useStreamGenerate 훅이 소비하는 공개 엔드포인트

/**
 * POST /api/generate/stream
 * 활성화된 AI 프로바이더의 스트리밍 응답을 Server-Sent Events(SSE)로 전달
 *
 * 요청: multipart/form-data (POST /api/generate와 동일 형식)
 *   - config: JSON 문자열 (GenerateRequestConfig 형식)
 *   - files: 첨부 파일 목록 (선택적)
 *
 * 응답: text/event-stream
 *   - delta 이벤트: {"provider":"chatgpt","type":"delta","content":"..."}
 *   - done 이벤트: {"provider":"chatgpt","type":"done","data":{...}}
 *   - error 이벤트: {"provider":"chatgpt","type":"error","message":"..."}
 */
export async function POST(request: NextRequest): Promise<Response> {
  // multipart/form-data 파싱
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(
      JSON.stringify(createErrorResponse("VALIDATION_ERROR", "multipart/form-data 파싱에 실패했습니다")),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // config 필드 추출
  const configRaw = formData.get("config");
  if (typeof configRaw !== "string" || configRaw.trim().length === 0) {
    return new Response(
      JSON.stringify(createErrorResponse("VALIDATION_ERROR", "config 필드가 누락되었습니다")),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // config JSON 파싱
  let configParsed: unknown;
  try {
    configParsed = JSON.parse(configRaw);
  } catch {
    return new Response(
      JSON.stringify(createErrorResponse("VALIDATION_ERROR", "config 필드가 올바른 JSON 형식이 아닙니다")),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Zod 스키마 유효성 검사
  const configValidation = generateRequestConfigSchema.safeParse(configParsed);
  if (!configValidation.success) {
    return new Response(
      JSON.stringify(
        createErrorResponse("VALIDATION_ERROR", "config 유효성 검사 실패", configValidation.error.flatten())
      ),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const config = configValidation.data;

  // 첨부 파일 변환
  const rawFiles = formData.getAll("files").filter((item): item is File => item instanceof File);
  let processedFiles: ProcessedFile[] = [];
  if (rawFiles.length > 0) {
    processedFiles = await Promise.all(rawFiles.map((file) => convertToProcessedFile(file)));
  }

  // 활성화된 프로바이더 목록
  const enabledProviders = (
    Object.entries(config.providers) as [
      ProviderName,
      { enabled: boolean; apiKey: string; model: string }
    ][]
  ).filter(([, providerConfig]) => providerConfig.enabled && providerConfig.apiKey.trim().length > 0);

  if (enabledProviders.length === 0) {
    return new Response(
      JSON.stringify(createErrorResponse("VALIDATION_ERROR", "활성화된 프로바이더가 없습니다")),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // JSON 스키마 파싱
  let parsedSchema: object | undefined;
  if (config.schema) {
    try {
      parsedSchema = JSON.parse(config.schema) as object;
    } catch {
      parsedSchema = undefined;
    }
  }

  // ReadableStream 생성 - 각 프로바이더를 독립적으로 스트리밍
  const readableStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      // 각 프로바이더를 병렬로 스트리밍 (독립 실행, 부분 실패 허용)
      const streamPromises = enabledProviders.map(async ([providerName, providerConfig]) => {
        const inputFields = config.inputFields?.map((f) => ({
          label: f.label,
          value: f.value,
        }));

        try {
          if (providerName === "chatgpt") {
            await streamChatGPT(
              providerConfig.apiKey,
              providerConfig.model,
              config.systemPrompt,
              config.userPrompt,
              parsedSchema,
              inputFields,
              processedFiles,
              controller
            );
          } else if (providerName === "gemini") {
            await streamGemini(
              providerConfig.apiKey,
              providerConfig.model,
              config.systemPrompt,
              config.userPrompt,
              parsedSchema,
              inputFields,
              processedFiles,
              controller
            );
          } else if (providerName === "claude") {
            await streamClaude(
              providerConfig.apiKey,
              providerConfig.model,
              config.systemPrompt,
              config.userPrompt,
              parsedSchema,
              inputFields,
              processedFiles,
              controller
            );
          }
        } catch (err) {
          // 프로바이더 오류 시 에러 이벤트 전송
          const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
          const errorEvent = {
            provider: providerName,
            type: "error" as const,
            message: errorMessage,
          };
          controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)));
        }
      });

      // 모든 스트리밍 완료 후 스트림 종료
      await Promise.allSettled(streamPromises);
      controller.close();
    },
  });

  // SSE 응답 반환
  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
