import type { AIOutput, HistoryItem, UploadAnalyzeConfig } from '@/lib/types'
import type { ProviderResult } from '@/lib/langchain/types'

export type OutputMap = Partial<
  Record<'chatgptOutput' | 'geminiOutput' | 'claudeOutput', AIOutput>
>

// ProviderResult.provider 이름과 OutputMap 키 매핑
const PROVIDER_KEY_MAP: Record<string, keyof OutputMap> = {
  ChatOpenAI: 'chatgptOutput',
  ChatGoogleGenerativeAI: 'geminiOutput',
  ChatAnthropic: 'claudeOutput',
}

/** 객체의 모든 value를 문자열로 변환한다. */
function getStringifyValues(
  obj: Record<string, unknown>,
): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, String(v)]))
}

/**
 * ProviderResult 배열을 AIOutput 형태의 OutputMap으로 변환한다.
 */
export function getOutputs(results: ProviderResult[]): OutputMap {
  const outputs: OutputMap = {}

  for (const result of results) {
    const key = PROVIDER_KEY_MAP[result.provider]
    if (!key) continue

    if (result.success) {
      // 구조화 출력 또는 텍스트를 Record<string, string>으로 변환
      const data: Record<string, string> = result.structuredOutput
        ? getStringifyValues(result.structuredOutput)
        : { 분석결과: result.content ?? '' }

      outputs[key] = { data, generated: true }
    } else {
      // 실패 시 에러 메시지를 데이터로 포함
      outputs[key] = {
        data: { 오류: result.error ?? '분석 중 오류가 발생했습니다' },
        generated: true,
      }
    }
  }

  return outputs
}

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
      config.userPrompt || `[파일 분석] ${files.map((f) => f.name).join(', ')}`,
    schema: config.schema || '',
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
