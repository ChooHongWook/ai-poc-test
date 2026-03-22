import { useState } from "react";
import { OutputDataSection, AIOutput } from "./components/OutputDataSection";
import { FileUploadSection } from "./components/FileUploadSection";
import { ConfigurationPanel, AIProvider } from "./components/ConfigurationPanel";
import { SystemPromptSection } from "./components/SystemPromptSection";
import { UserPromptSection } from "./components/UserPromptSection";
import { SchemaSection } from "./components/SchemaSection";
import { InputDataSection } from "./components/InputDataSection";
import { Button } from "./components/ui/button";
import { Sparkles, Loader2, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

export interface HistoryItem {
  id: string;
  timestamp: Date;
  systemPrompt: string;
  userPrompt: string;
  schema: string;
  inputFields: { id: string; label: string; value: string }[];
  chatgptOutput?: AIOutput;
  geminiOutput?: AIOutput;
  claudeOutput?: AIOutput;
}

export default function App() {
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // AI Provider state
  const [chatgpt, setChatGPT] = useState<AIProvider>({
    enabled: false,
    apiKey: "",
    model: "",
  });
  const [gemini, setGemini] = useState<AIProvider>({
    enabled: false,
    apiKey: "",
    model: "",
  });
  const [claude, setClaude] = useState<AIProvider>({
    enabled: false,
    apiKey: "",
    model: "",
  });

  // Configuration state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [schema, setSchema] = useState("");

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

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleGenerate = async () => {
    // Validation
    if (!chatgpt.enabled && !gemini.enabled && !claude.enabled) {
      toast.error("AI 모델을 선택해주세요");
      return;
    }
    if (!chatgpt.apiKey && !gemini.apiKey && !claude.apiKey) {
      toast.error("API Key를 입력해주세요");
      return;
    }
    if (!systemPrompt || !userPrompt) {
      toast.error("System Prompt와 User Prompt를 입력해주세요");
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Base data from input fields
      const baseData: Record<string, string> = {};
      inputFields.forEach((field) => {
        if (field.value) {
          baseData[field.label] = field.value;
        }
      });

      // Temporary storage for outputs
      let newChatGPTOutput: AIOutput | undefined;
      let newGeminiOutput: AIOutput | undefined;
      let newClaudeOutput: AIOutput | undefined;

      // Generate different outputs for each AI provider
      if (chatgpt.enabled) {
        const chatgptData: Record<string, string> = {
          "문서 제목": "ChatGPT 생성 문서",
          "작성일": new Date().toLocaleDateString("ko-KR"),
          "요약": "ChatGPT를 활용하여 생성한 전문적인 문서입니다.",
          "주요 내용": "사용자 프롬프트를 기반으로 구조화된 내용을 작성했습니다.",
          "결론": "ChatGPT 모델을 통한 문서 생성이 완료되었습니다.",
          ...baseData,
        };
        newChatGPTOutput = { data: chatgptData, generated: true };
        setChatGPTOutput(newChatGPTOutput);
      }

      if (gemini.enabled) {
        const geminiData: Record<string, string> = {
          "문서 제목": "Gemini 생성 문서",
          "작성일": new Date().toLocaleDateString("ko-KR"),
          "요약": "Google Gemini로 작성한 혁신적인 문서입니다.",
          "주요 내용": "멀티모달 능력을 활용한 풍부한 컨텐츠를 제공합니다.",
          "결론": "Gemini 모델의 강력한 성능이 입증되었습니다.",
          ...baseData,
        };
        newGeminiOutput = { data: geminiData, generated: true };
        setGeminiOutput(newGeminiOutput);
      }

      if (claude.enabled) {
        const claudeData: Record<string, string> = {
          "문서 제목": "Claude 생성 문서",
          "작성일": new Date().toLocaleDateString("ko-KR"),
          "요약": "Anthropic Claude가 작성한 상세하고 정확한 문서입니다.",
          "주요 내용": "윤리적이고 안전한 AI 원칙에 따라 신중하게 작성되었습니다.",
          "결론": "Claude 모델의 신뢰성과 품질이 돋보입니다.",
          ...baseData,
        };
        newClaudeOutput = { data: claudeData, generated: true };
        setClaudeOutput(newClaudeOutput);
      }

      // Save to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        systemPrompt,
        userPrompt,
        schema,
        inputFields: [...inputFields],
        chatgptOutput: newChatGPTOutput,
        geminiOutput: newGeminiOutput,
        claudeOutput: newClaudeOutput,
      };
      setHistory([newHistoryItem, ...history]);

      toast.success("문서가 성공적으로 생성되었습니다!");
    } catch (error) {
      toast.error("문서 생성 중 오류가 발생했습니다");
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
            
            {/* Dark Mode Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="다크모드 토글"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
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
              history={history}
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