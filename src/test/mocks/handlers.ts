import { http, HttpResponse } from "msw";

// MSW v2 핸들러 - API 모킹
export const handlers = [
  // 헬스 체크 API 모킹
  http.get("/api/health", () => {
    return HttpResponse.json({ status: "ok", timestamp: new Date().toISOString(), version: "0.0.1" });
  }),
  // AI 생성 API 모킹
  http.post("/api/generate", async () => {
    return HttpResponse.json({
      success: true,
      results: {
        chatgpt: { provider: "chatgpt", model: "gpt-4o", data: { title: "테스트 결과" }, rawText: "", usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 }, latencyMs: 500 },
        gemini: null,
        claude: null,
      },
      errors: { chatgpt: null, gemini: null, claude: null },
    });
  }),
  // 스키마 유효성 검사 API 모킹
  http.post("/api/validate-schema", async ({ request }) => {
    const body = await request.json() as { schema: string };
    try {
      const parsed = JSON.parse(body.schema);
      return HttpResponse.json({ valid: true, parsed });
    } catch {
      return HttpResponse.json({ valid: false, error: "Invalid JSON" });
    }
  }),
];
