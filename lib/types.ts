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
}
