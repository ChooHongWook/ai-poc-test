'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Settings, Zap } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  AIProviderConfigItem,
  type ModelOption,
} from '@/app/(main)/_components/AIProviderConfigItem'
import type { AIProvider } from '@/lib/providers/ai-config-provider'

interface ConfigurationPanelProps {
  chatgpt: AIProvider
  gemini: AIProvider
  claude: AIProvider
  onChatGPTChange: (provider: AIProvider) => void
  onGeminiChange: (provider: AIProvider) => void
  onClaudeChange: (provider: AIProvider) => void
}

const CHATGPT_MODELS: ModelOption[] = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
]

const GEMINI_MODELS: ModelOption[] = [
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
  { value: 'gemini-ultra', label: 'Gemini Ultra' },
]

const CLAUDE_MODELS: ModelOption[] = [
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'claude-2', label: 'Claude 2' },
]

export function ConfigurationPanel({
  chatgpt,
  gemini,
  claude,
  onChatGPTChange,
  onGeminiChange,
  onClaudeChange,
}: ConfigurationPanelProps) {
  const handleApplyDefaultKeys = () => {
    // 기본값 API Key 적용
    onChatGPTChange({
      enabled: true,
      apiKey: 'sk-proj-demo-chatgpt-api-key-1234567890',
      model: 'gpt-4o',
    })
    onGeminiChange({
      enabled: true,
      apiKey: 'AIzaSy-demo-gemini-api-key-1234567890',
      model: 'gemini-pro',
    })
    onClaudeChange({
      enabled: true,
      apiKey: 'sk-ant-demo-claude-api-key-1234567890',
      model: 'claude-3-sonnet',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI 제공자 설정
        </CardTitle>
        <CardDescription>
          사용할 AI 제공자를 선택하고 설정하세요 (복수 선택 가능)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Setup Button */}
        <div
          className={cn(
            // 크기/간격
            'rounded-lg p-4',
            // 색상/배경
            'bg-primary/5 border-primary/20 border',
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium">빠른 설정</p>
              <p className="text-muted-foreground text-xs">
                테스트용 기본 API Key를 모든 제공자에 적용합니다
              </p>
            </div>
            <Button
              onClick={handleApplyDefaultKeys}
              variant="default"
              size="sm"
              className="flex-shrink-0"
            >
              <Zap className="mr-2 h-4 w-4" />
              기본값 적용
            </Button>
          </div>
        </div>

        <Separator />

        {/* ChatGPT Section */}
        <AIProviderConfigItem
          id="chatgpt"
          label="ChatGPT (OpenAI)"
          iconColor="text-green-600"
          checked={chatgpt.enabled}
          onCheckedChange={(checked) =>
            onChatGPTChange({ ...chatgpt, enabled: checked })
          }
          model={chatgpt.model}
          onModelChange={(value) =>
            onChatGPTChange({ ...chatgpt, model: value })
          }
          modelOptions={CHATGPT_MODELS}
          apiKey={chatgpt.apiKey}
          onApiKeyChange={(value) =>
            onChatGPTChange({ ...chatgpt, apiKey: value })
          }
          apiKeyPlaceholder="sk-..."
        />

        <Separator />

        {/* Gemini Section */}
        <AIProviderConfigItem
          id="gemini"
          label="Gemini (Google)"
          iconColor="text-blue-600"
          checked={gemini.enabled}
          onCheckedChange={(checked) =>
            onGeminiChange({ ...gemini, enabled: checked })
          }
          model={gemini.model}
          onModelChange={(value) => onGeminiChange({ ...gemini, model: value })}
          modelOptions={GEMINI_MODELS}
          apiKey={gemini.apiKey}
          onApiKeyChange={(value) =>
            onGeminiChange({ ...gemini, apiKey: value })
          }
          apiKeyPlaceholder="AI..."
        />

        <Separator />

        {/* Claude Section */}
        <AIProviderConfigItem
          id="claude"
          label="Claude (Anthropic)"
          iconColor="text-purple-600"
          checked={claude.enabled}
          onCheckedChange={(checked) =>
            onClaudeChange({ ...claude, enabled: checked })
          }
          model={claude.model}
          onModelChange={(value) => onClaudeChange({ ...claude, model: value })}
          modelOptions={CLAUDE_MODELS}
          apiKey={claude.apiKey}
          onApiKeyChange={(value) =>
            onClaudeChange({ ...claude, apiKey: value })
          }
          apiKeyPlaceholder="sk-ant-..."
        />
      </CardContent>
    </Card>
  )
}
