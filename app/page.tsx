'use client'

import { useState } from 'react'
import { ConfigurationPanel } from '@/app/(main)/_components/ConfigurationPanel'
import { SystemPromptSection } from '@/app/(main)/_components/SystemPromptSection'
import { UserPromptSection } from '@/app/(main)/_components/UserPromptSection'
import { SchemaSection } from '@/app/(main)/_components/SchemaSection'
import { InputDataSection } from '@/app/(main)/_components/InputDataSection'
import { FileUploadSection } from '@/app/(main)/_components/FileUploadSection'
import { OutputDataSection } from '@/app/(main)/_components/OutputDataSection'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAIConfig } from '@/lib/providers/ai-config-provider'
import { useHistory } from '@/lib/providers/history-provider'
import { generateMockOutput } from '@/lib/mock/generate'
import type { AIOutput } from '@/lib/types'

export default function HomePage() {
  // AI Provider state from context
  const { chatgpt, gemini, claude, setChatGPT, setGemini, setClaude } =
    useAIConfig()

  // History from context
  const { history, addHistory } = useHistory()

  // Configuration state
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [schema, setSchema] = useState('')

  // Input data state
  const [inputFields, setInputFields] = useState<
    { id: string; label: string; value: string }[]
  >([])

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; file: File; name: string; size: string; type: string }[]
  >([])

  // Output data state
  const [chatgptOutput, setChatGPTOutput] = useState<AIOutput>({
    data: {},
    generated: false,
  })
  const [geminiOutput, setGeminiOutput] = useState<AIOutput>({
    data: {},
    generated: false,
  })
  const [claudeOutput, setClaudeOutput] = useState<AIOutput>({
    data: {},
    generated: false,
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    // Validation
    if (!chatgpt.enabled && !gemini.enabled && !claude.enabled) {
      toast.error('AI 모델을 선택해주세요')
      return
    }
    if (!chatgpt.apiKey && !gemini.apiKey && !claude.apiKey) {
      toast.error('API Key를 입력해주세요')
      return
    }
    if (!systemPrompt || !userPrompt) {
      toast.error('System Prompt와 User Prompt를 입력해주세요')
      return
    }

    setIsGenerating(true)

    try {
      const result = await generateMockOutput({
        chatgpt,
        gemini,
        claude,
        systemPrompt,
        userPrompt,
        schema,
        inputFields,
      })

      if (result.chatgptOutput) setChatGPTOutput(result.chatgptOutput)
      if (result.geminiOutput) setGeminiOutput(result.geminiOutput)
      if (result.claudeOutput) setClaudeOutput(result.claudeOutput)

      addHistory(result.historyItem)

      toast.success('문서가 성공적으로 생성되었습니다!')
    } catch (error) {
      toast.error('문서 생성 중 오류가 발생했습니다')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateButton = (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating}
      size="lg"
      className="w-full"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          문서 생성 중...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" />
          문서 생성하기
        </>
      )}
    </Button>
  )

  return (
    <div className="bg-background min-h-screen">
      <Toaster />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Generate Button - Top */}
            {generateButton}

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

            <UserPromptSection value={userPrompt} onChange={setUserPrompt} />

            <SchemaSection value={schema} onChange={setSchema} />

            <InputDataSection
              inputFields={inputFields}
              onInputFieldsChange={setInputFields}
            />

            <FileUploadSection
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
            />

            {/* Generate Button - Bottom */}
            {generateButton}
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
    </div>
  )
}
