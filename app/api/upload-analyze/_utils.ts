import type { AIOutput, HistoryItem, UploadAnalyzeConfig } from '@/lib/types'

type OutputMap = Partial<
  Record<'chatgptOutput' | 'geminiOutput' | 'claudeOutput', AIOutput>
>

/**
 * 분석 결과와 요청 정보를 기반으로 HistoryItem을 생성한다.
 */
export function getHistoryItem(
  files: File[],
  config: UploadAnalyzeConfig,
  outputs: OutputMap,
): HistoryItem {
  return {
    id: Date.now().toString(),
    timestamp: new Date(),
    systemPrompt: config.systemPrompt,
    userPrompt:
      config.userPrompt ||
      `[파일 분석] ${files.map((f) => f.name).join(', ')}`,
    schema: config.schema,
    inputFields: files.map((file, i) => ({
      id: `file-${i}`,
      label: file.name,
      value: `${(file.size / 1024).toFixed(1)}KB`,
    })),
    chatgptOutput: outputs.chatgptOutput,
    geminiOutput: outputs.geminiOutput,
    claudeOutput: outputs.claudeOutput,
    models: {
      ...(outputs.chatgptOutput ? { chatgpt: config.chatgpt.model } : {}),
      ...(outputs.geminiOutput ? { gemini: config.gemini.model } : {}),
      ...(outputs.claudeOutput ? { claude: config.claude.model } : {}),
    },
  }
}
