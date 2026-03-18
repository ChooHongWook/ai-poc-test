"use client";

import { useState } from "react";
import { ConfigurationPanel } from "./components/ConfigurationPanel";
import { SystemPromptSection } from "./components/SystemPromptSection";
import { UserPromptSection } from "./components/UserPromptSection";
import { SchemaSection } from "./components/SchemaSection";
import { InputDataSection } from "./components/InputDataSection";
import { OutputDataSection, AIOutput } from "./components/OutputDataSection";
import { FileUploadSection } from "./components/FileUploadSection";
import { Button } from "./components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import type { GenerateRequestConfig, GenerateResponse } from "@/lib/types";
import { useProviderConfig } from "@/hooks/useProviderConfig";
import { usePromptConfig } from "@/hooks/usePromptConfig";

export default function App() {
  // AI 프로바이더 상태 - localStorage에 enabled/model 영속화 (API Key는 메모리만)
  const { chatgpt, gemini, claude, setChatGPT, setGemini, setClaude } = useProviderConfig();

  // 프롬프트 설정 상태 - localStorage에 자동 저장
  const { systemPrompt, userPrompt, schema, setSystemPrompt, setUserPrompt, setSchema } =
    usePromptConfig();

  // Input data state
  const [inputFields, setInputFields] = useState<
    { id: string; label: string; value: string }[]
  >([]);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; file: File; name: string; size: string; type: string }[]
  >([]);

  // Output data state
  const [chatgptOutput, setChatGPTOutput] = useState<AIOutput>({
    data: {},
    generated: false,
  });
  const [geminiOutput, setGeminiOutput] = useState<AIOutput>({
    data: {},
    generated: false,
  });
  const [claudeOutput, setClaudeOutput] = useState<AIOutput>({
    data: {},
    generated: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    // 유효성 검사
    if (!chatgpt.enabled && !gemini.enabled && !claude.enabled) {
      toast.error("AI 모델을 선택해주세요");
      return;
    }

    // 활성화된 프로바이더의 API Key 검사
    const enabledProviders = [
      { name: "ChatGPT", config: chatgpt },
      { name: "Gemini", config: gemini },
      { name: "Claude", config: claude },
    ].filter((p) => p.config.enabled);

    const missingKeys = enabledProviders.filter((p) => !p.config.apiKey.trim());
    if (missingKeys.length > 0) {
      toast.error(`${missingKeys.map((p) => p.name).join(", ")}의 API Key를 입력해주세요`);
      return;
    }

    if (!systemPrompt.trim() || !userPrompt.trim()) {
      toast.error("System Prompt와 User Prompt를 입력해주세요");
      return;
    }

    setIsGenerating(true);

    try {
      // API 요청 구성
      const config: GenerateRequestConfig = {
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

      const formData = new FormData();
      formData.append("config", JSON.stringify(config));

      // 업로드된 파일 첨부
      uploadedFiles.forEach(({ file }) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data: GenerateResponse = await response.json();

      // 프로바이더별 결과 처리
      if (data.results.chatgpt) {
        setChatGPTOutput({ data: data.results.chatgpt.data as Record<string, string>, generated: true });
      }
      if (data.results.gemini) {
        setGeminiOutput({ data: data.results.gemini.data as Record<string, string>, generated: true });
      }
      if (data.results.claude) {
        setClaudeOutput({ data: data.results.claude.data as Record<string, string>, generated: true });
      }

      // 에러 처리
      if (data.errors) {
        for (const [provider, error] of Object.entries(data.errors)) {
          if (error) {
            toast.error(`${provider}: ${error.message}`);
          }
        }
      }

      if (data.success) {
        toast.success("문서가 성공적으로 생성되었습니다!");
      }
    } catch (error) {
      toast.error("문서 생성 중 오류가 발생했습니다. 네트워크를 확인해주세요.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">AI 문서 생성 POC</h1>
              <p className="text-sm text-muted-foreground">
                AI 기반 자동 문서 생성 시스템 개념 검증
              </p>
            </div>
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

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  문서 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  문서 생성하기
                </>
              )}
            </Button>
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