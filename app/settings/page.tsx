'use client'

import { useAIConfig } from '@/lib/providers/ai-config-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

// AI 제공자 설정 카드 컴포넌트
function ProviderCard({
  name,
  label,
}: {
  name: 'chatgpt' | 'gemini' | 'claude'
  label: string
}) {
  const { chatgpt, gemini, claude, setChatGPT, setGemini, setClaude } =
    useAIConfig()

  // 현재 제공자 상태 및 업데이트 함수 선택
  const providerMap = {
    chatgpt: { state: chatgpt, setter: setChatGPT },
    gemini: { state: gemini, setter: setGemini },
    claude: { state: claude, setter: setClaude },
  }

  const { state, setter } = providerMap[name]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{label}</CardTitle>
          <Switch
            checked={state.enabled}
            onCheckedChange={(enabled) => setter({ ...state, enabled })}
            aria-label={`${label} 활성화`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${name}-apikey`}>API Key</Label>
          <Input
            id={`${name}-apikey`}
            type="password"
            placeholder="API Key를 입력하세요"
            value={state.apiKey}
            onChange={(e) => setter({ ...state, apiKey: e.target.value })}
            disabled={!state.enabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${name}-model`}>모델</Label>
          <Input
            id={`${name}-model`}
            placeholder="모델명을 입력하세요"
            value={state.model}
            onChange={(e) => setter({ ...state, model: e.target.value })}
            disabled={!state.enabled}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// AI 제공자 설정 페이지
export default function SettingsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">AI 제공자 설정</h2>
      <div className="space-y-6 max-w-2xl">
        <ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />
        <ProviderCard name="gemini" label="Gemini (Google)" />
        <ProviderCard name="claude" label="Claude (Anthropic)" />
      </div>
    </main>
  )
}
