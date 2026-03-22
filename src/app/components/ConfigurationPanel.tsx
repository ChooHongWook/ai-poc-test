"use client";

import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Settings, Bot } from "lucide-react";
import { Separator } from "./ui/separator";
import { cn } from "./ui/utils";

export interface AIProvider {
  enabled: boolean;
  apiKey: string;
  model: string;
}

interface ConfigurationPanelProps {
  chatgpt: AIProvider;
  gemini: AIProvider;
  claude: AIProvider;
  onChatGPTChange: (provider: AIProvider) => void;
  onGeminiChange: (provider: AIProvider) => void;
  onClaudeChange: (provider: AIProvider) => void;
}

export function ConfigurationPanel({
  chatgpt,
  gemini,
  claude,
  onChatGPTChange,
  onGeminiChange,
  onClaudeChange,
}: ConfigurationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          AI 제공자 설정
        </CardTitle>
        <CardDescription>
          사용할 AI 제공자를 선택하고 설정하세요 (복수 선택 가능)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ChatGPT Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="chatgpt-enabled"
              checked={chatgpt.enabled}
              onCheckedChange={(checked) =>
                onChatGPTChange({ ...chatgpt, enabled: checked as boolean })
              }
            />
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-600" />
              <Label
                htmlFor="chatgpt-enabled"
                className={cn(
                  // 타이포그래피
                  "text-base font-semibold",
                  // 인터랙션
                  "cursor-pointer",
                )}
              >
                ChatGPT (OpenAI)
              </Label>
            </div>
          </div>

          {chatgpt.enabled && (
            <div className={cn(
              // 레이아웃 / 간격
              "ml-8 space-y-3 p-4",
              // 색상 / 테두리
              "border rounded-lg bg-muted/30",
            )}>
              <div className="space-y-2">
                <Label htmlFor="chatgpt-model">모델 선택</Label>
                <Select
                  value={chatgpt.model}
                  onValueChange={(value) =>
                    onChatGPTChange({ ...chatgpt, model: value })
                  }
                >
                  <SelectTrigger id="chatgpt-model">
                    <SelectValue placeholder="모델을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chatgpt-key">API Key</Label>
                <Input
                  id="chatgpt-key"
                  type="password"
                  placeholder="sk-..."
                  value={chatgpt.apiKey}
                  onChange={(e) =>
                    onChatGPTChange({ ...chatgpt, apiKey: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Gemini Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="gemini-enabled"
              checked={gemini.enabled}
              onCheckedChange={(checked) =>
                onGeminiChange({ ...gemini, enabled: checked as boolean })
              }
            />
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <Label
                htmlFor="gemini-enabled"
                className={cn(
                  // 타이포그래피
                  "text-base font-semibold",
                  // 인터랙션
                  "cursor-pointer",
                )}
              >
                Gemini (Google)
              </Label>
            </div>
          </div>

          {gemini.enabled && (
            <div className={cn(
              // 레이아웃 / 간격
              "ml-8 space-y-3 p-4",
              // 색상 / 테두리
              "border rounded-lg bg-muted/30",
            )}>
              <div className="space-y-2">
                <Label htmlFor="gemini-model">모델 선택</Label>
                <Select
                  value={gemini.model}
                  onValueChange={(value) =>
                    onGeminiChange({ ...gemini, model: value })
                  }
                >
                  <SelectTrigger id="gemini-model">
                    <SelectValue placeholder="모델을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    <SelectItem value="gemini-pro-vision">
                      Gemini Pro Vision
                    </SelectItem>
                    <SelectItem value="gemini-ultra">Gemini Ultra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gemini-key">API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="AI..."
                  value={gemini.apiKey}
                  onChange={(e) =>
                    onGeminiChange({ ...gemini, apiKey: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Claude Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="claude-enabled"
              checked={claude.enabled}
              onCheckedChange={(checked) =>
                onClaudeChange({ ...claude, enabled: checked as boolean })
              }
            />
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              <Label
                htmlFor="claude-enabled"
                className={cn(
                  // 타이포그래피
                  "text-base font-semibold",
                  // 인터랙션
                  "cursor-pointer",
                )}
              >
                Claude (Anthropic)
              </Label>
            </div>
          </div>

          {claude.enabled && (
            <div className={cn(
              // 레이아웃 / 간격
              "ml-8 space-y-3 p-4",
              // 색상 / 테두리
              "border rounded-lg bg-muted/30",
            )}>
              <div className="space-y-2">
                <Label htmlFor="claude-model">모델 선택</Label>
                <Select
                  value={claude.model}
                  onValueChange={(value) =>
                    onClaudeChange({ ...claude, model: value })
                  }
                >
                  <SelectTrigger id="claude-model">
                    <SelectValue placeholder="모델을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet">
                      Claude 3 Sonnet
                    </SelectItem>
                    <SelectItem value="claude-3-haiku">
                      Claude 3 Haiku
                    </SelectItem>
                    <SelectItem value="claude-2">Claude 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claude-key">API Key</Label>
                <Input
                  id="claude-key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={claude.apiKey}
                  onChange={(e) =>
                    onClaudeChange({ ...claude, apiKey: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
