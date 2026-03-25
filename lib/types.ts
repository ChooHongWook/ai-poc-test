// AI 출력 데이터 타입 (공유 타입)
export interface AIOutput {
  data: Record<string, string>
  generated: boolean
}

// 히스토리 아이템 타입
export interface HistoryItem {
  id: string
  timestamp: Date
  systemPrompt: string
  userPrompt: string
  schema: string
  inputFields: { id: string; label: string; value: string }[]
  chatgptOutput?: AIOutput
  geminiOutput?: AIOutput
  claudeOutput?: AIOutput
  models?: {
    chatgpt?: string
    gemini?: string
    claude?: string
  }
}

export interface AiConfig {
  enabled: boolean
  apiKey: string
  model: string
}

// AI 제공자별 설정 타입
export interface AiProviderConfigs {
  chatgpt: AiConfig
  gemini: AiConfig
  claude: AiConfig
}

// 업로드 분석 요청 설정 타입
export interface UploadAnalyzeConfig extends AiProviderConfigs {
  systemPrompt: string
  userPrompt: string
  schema?: string
}
