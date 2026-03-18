// 프로바이더 팩토리 - 이름으로 프로바이더 인스턴스 생성

import type { ProviderName } from "@/lib/types";
import type { AIProviderClient } from "@/lib/ai/types";
import { ChatGPTProvider } from "@/lib/ai/chatgpt";
import { GeminiProvider } from "@/lib/ai/gemini";
import { ClaudeProvider } from "@/lib/ai/claude";

// @MX:ANCHOR: 프로바이더 팩토리 함수 - 모든 프로바이더 인스턴스화의 중앙 진입점
// @MX:REASON: 라우트 핸들러에서 호출되는 공개 팩토리 함수로 새 프로바이더 추가 시 여기서만 수정하면 됨

/**
 * 프로바이더 이름에 해당하는 AIProviderClient 인스턴스를 생성하여 반환
 *
 * @param name - 생성할 프로바이더 이름 ("chatgpt" | "gemini" | "claude")
 * @returns 해당 프로바이더의 AIProviderClient 구현체
 */
export function createProvider(name: ProviderName): AIProviderClient {
  switch (name) {
    case "chatgpt":
      return new ChatGPTProvider();
    case "gemini":
      return new GeminiProvider();
    case "claude":
      return new ClaudeProvider();
  }
}
