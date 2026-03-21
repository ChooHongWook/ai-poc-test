"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { ConfigurationPanel } from "./components/ConfigurationPanel";
import { SystemPromptSection } from "./components/SystemPromptSection";
import { UserPromptSection } from "./components/UserPromptSection";
import { SchemaSection } from "./components/SchemaSection";
import { InputDataSection } from "./components/InputDataSection";
import { OutputDataSection, AIOutput } from "./components/OutputDataSection";
import { FileUploadSection } from "./components/FileUploadSection";
import { Button } from "./components/ui/button";
import { Sparkles, Loader2, X, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import type { GenerateRequestConfig, GenerateResponse } from "@/lib/types";
import { useProviderConfig } from "@/hooks/useProviderConfig";
import { usePromptConfig } from "@/hooks/usePromptConfig";
import { useStreamGenerate } from "@/hooks/useStreamGenerate";

export default function App() {
  // AI 프로바이더 상태 - localStorage에 enabled/model 영속화 (API Key는 메모리만)
  const { theme, setTheme } = useTheme();
  const { chatgpt, gemini, claude, setChatGPT, setGemini, setClaude } = useProviderConfig();

  // 프롬프트 설정 상태 - localStorage에 자동 저장
  const { systemPrompt, userPrompt, schema, setSystemPrompt, setUserPrompt, setSchema } =
    usePromptConfig();

  // 입력 필드 상태
  const [inputFields, setInputFields] = useState<
    { id: string; label: string; value: string }[]
  >([]);

  // 파일 업로드 상태
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; file: File; name: string; size: string; type: string }[]
  >([]);

  // 스트리밍 훅 - 실시간 AI 응답 처리
  const {
    outputs: streamOutputs,
    isGenerating: isStreamGenerating,
    startStreaming,
    cancelStreaming,
  } = useStreamGenerate();

  // 스트리밍 출력을 OutputDataSection의 AIOutput 형식으로 매핑
  const chatgptOutput: AIOutput = {
    data: streamOutputs.chatgpt.generated
      ? streamOutputs.chatgpt.data
      : streamOutputs.chatgpt.streaming
        ? { result: streamOutputs.chatgpt.rawText }
        : {},
    generated: streamOutputs.chatgpt.generated,
  };

  const geminiOutput: AIOutput = {
    data: streamOutputs.gemini.generated
      ? streamOutputs.gemini.data
      : streamOutputs.gemini.streaming
        ? { result: streamOutputs.gemini.rawText }
        : {},
    generated: streamOutputs.gemini.generated,
  };

  const claudeOutput: AIOutput = {
    data: streamOutputs.claude.generated
      ? streamOutputs.claude.data
      : streamOutputs.claude.streaming
        ? { result: streamOutputs.claude.rawText }
        : {},
    generated: streamOutputs.claude.generated,
  };

  // 전체 생성 중 여부 (스트리밍 기준)
  const isGenerating = isStreamGenerating;

  /**
   * 공통 유효성 검사 및 요청 구성 헬퍼
   */
  const buildConfig = (): GenerateRequestConfig | null => {
    if (!chatgpt.enabled && !gemini.enabled && !claude.enabled) {
      toast.error("AI 모델을 선택해주세요");
      return null;
    }

    const enabledProviders = [
      { name: "ChatGPT", config: chatgpt },
      { name: "Gemini", config: gemini },
      { name: "Claude", config: claude },
    ].filter((p) => p.config.enabled);

    const missingKeys = enabledProviders.filter((p) => !p.config.apiKey.trim());
    if (missingKeys.length > 0) {
      toast.error(`${missingKeys.map((p) => p.name).join(", ")}의 API Key를 입력해주세요`);
      return null;
    }

    if (!systemPrompt.trim() || !userPrompt.trim()) {
      toast.error("System Prompt와 User Prompt를 입력해주세요");
      return null;
    }

    return {
      systemPrompt,
      userPrompt,
      schema: schema || undefined,
      inputFields: inputFields.length > 0 ? inputFields : undefined,
      providers: {
        chatgpt: { enabled: chatgpt.enabled, apiKey: chatgpt.apiKey, model: chatgpt.model },
        gemini: { enabled: gemini.enabled, apiKey: gemini.apiKey, model: gemini.model },
        claude: { enabled: claude.enabled, apiKey: claude.apiKey, model: claude.model },
      },
    };
  };

  /**
   * 스트리밍 방식으로 문서 생성 (기본)
   * startStreaming은 완료될 때까지 대기하며, 완료 후 상태는 React 렌더링 사이클로 반영됨
   */
  const handleGenerateStream = async () => {
    const config = buildConfig();
    if (!config) return;

    try {
      const files = uploadedFiles.map(({ file }) => file);
      await startStreaming(config, files);
      // 스트리밍 완료 - 성공/오류 알림은 상태 업데이트 이후 effect에서 처리하거나
      // 여기서는 단순히 완료 메시지만 표시 (실제 결과는 outputs 상태에 반영됨)
      toast.success("스트리밍이 완료되었습니다!");
    } catch {
      // 스트리밍 실패 시 폴백으로 동기 방식 시도
      toast.error("스트리밍 실패 - 동기 모드로 재시도합니다");
      await handleGenerateSync();
    }
  };

  /**
   * 동기(비스트리밍) 방식 폴백 - 스트리밍 실패 시 사용
   */
  const handleGenerateSync = async () => {
    const config = buildConfig();
    if (!config) return;

    try {
      const formData = new FormData();
      formData.append("config", JSON.stringify(config));
      uploadedFiles.forEach(({ file }) => formData.append("files", file));

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data: GenerateResponse = await response.json();

      // 에러 처리
      if (data.errors) {
        for (const [provider, error] of Object.entries(data.errors)) {
          if (error) {
            toast.error(`${provider}: ${error.message}`);
          }
        }
      }

      if (data.success) {
        toast.success("문서가 성공적으로 생성되었습니다! (폴백 모드)");
      }
    } catch (error) {
      toast.error("문서 생성 중 오류가 발생했습니다. 네트워크를 확인해주세요.");
      console.error(error);
    }
  };

  // 메인 핸들러 - 스트리밍 방식 사용
  const handleGenerate = handleGenerateStream;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">AI 문서 생성 POC</h1>
                <p className="text-sm text-muted-foreground">
                  AI 기반 자동 문서 생성 시스템 개념 검증
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="다크모드 전환"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            <ConfigurationPanel
              chatgpt={chatgpt}
              gemini={gemini}
              claude={claude}
              onChatGPTChange={setChatGPT}
              onGeminiChange={setGemini}
              onClaudeChange={setClaude}
            />

            <SystemPromptSection
              value={systemPrompt}
              onChange={setSystemPrompt}
            />

            <UserPromptSection
              value={userPrompt}
              onChange={setUserPrompt}
            />

            <SchemaSection
              value={schema}
              onChange={setSchema}
            />

            <InputDataSection
              inputFields={inputFields}
              onInputFieldsChange={setInputFields}
            />

            <FileUploadSection
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
            />

            {/* 생성 버튼 및 취소 버튼 영역 */}
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    스트리밍 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    문서 생성하기
                  </>
                )}
              </Button>

              {/* 스트리밍 취소 버튼 - 생성 중에만 표시 */}
              {isGenerating && (
                <Button
                  onClick={() => cancelStreaming()}
                  variant="outline"
                  size="lg"
                  className="shrink-0"
                  title="스트리밍 취소"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Output */}
          <div>
            <OutputDataSection
              chatgptOutput={chatgptOutput}
              geminiOutput={geminiOutput}
              claudeOutput={claudeOutput}
              enabledProviders={{
                chatgpt: chatgpt.enabled,
                gemini: gemini.enabled,
                claude: claude.enabled,
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 AI 문서 생성 POC | Proof of Concept Application
          </p>
        </div>
      </footer>
    </div>
  );
}