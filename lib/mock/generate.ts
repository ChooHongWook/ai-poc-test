import type { AIProvider } from '@/lib/providers/ai-config-provider'
import type { AIOutput, HistoryItem } from '@/lib/types'

// handleGenerate 함수에 필요한 파라미터 타입
export interface GenerateParams {
  chatgpt: AIProvider
  gemini: AIProvider
  claude: AIProvider
  systemPrompt: string
  userPrompt: string
  schema: string
  inputFields: { id: string; label: string; value: string }[]
}

// 생성 결과 타입
export interface GenerateResult {
  chatgptOutput?: AIOutput
  geminiOutput?: AIOutput
  claudeOutput?: AIOutput
  historyItem: HistoryItem
}

// AI 출력 Mock 생성 함수 (실제 API 대신 2초 지연 후 목업 데이터 반환)
export async function generateMockOutput(
  params: GenerateParams,
): Promise<GenerateResult> {
  const {
    chatgpt,
    gemini,
    claude,
    systemPrompt,
    userPrompt,
    schema,
    inputFields,
  } = params

  // API 호출 시뮬레이션 (2초 지연)
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // 입력 필드 데이터를 기본 데이터로 변환
  const baseData: Record<string, string> = {}
  inputFields.forEach((field) => {
    if (field.value) {
      baseData[field.label] = field.value
    }
  })

  let chatgptOutput: AIOutput | undefined
  let geminiOutput: AIOutput | undefined
  let claudeOutput: AIOutput | undefined

  // ChatGPT 출력 생성
  if (chatgpt.enabled) {
    const chatgptData: Record<string, string> = {
      '문서 제목': 'ChatGPT 생성 문서',
      작성일: new Date().toLocaleDateString('ko-KR'),
      요약: 'ChatGPT를 활용하여 생성한 전문적인 문서입니다.',
      '주요 내용': '사용자 프롬프트를 기반으로 구조화된 내용을 작성했습니다.',
      결론: 'ChatGPT 모델을 통한 문서 생성이 완료되었습니다.',
      ...baseData,
    }
    chatgptOutput = { data: chatgptData, generated: true }
  }

  // Gemini 출력 생성
  if (gemini.enabled) {
    const geminiData: Record<string, string> = {
      '문서 제목': 'Gemini 생성 문서',
      작성일: new Date().toLocaleDateString('ko-KR'),
      요약: 'Google Gemini로 작성한 혁신적인 문서입니다.',
      '주요 내용': '멀티모달 능력을 활용한 풍부한 컨텐츠를 제공합니다.',
      결론: 'Gemini 모델의 강력한 성능이 입증되었습니다.',
      ...baseData,
    }
    geminiOutput = { data: geminiData, generated: true }
  }

  // Claude 출력 생성
  if (claude.enabled) {
    const claudeData: Record<string, string> = {
      '문서 제목': 'Claude 생성 문서',
      작성일: new Date().toLocaleDateString('ko-KR'),
      요약: 'Anthropic Claude가 작성한 상세하고 정확한 문서입니다.',
      '주요 내용': '윤리적이고 안전한 AI 원칙에 따라 신중하게 작성되었습니다.',
      결론: 'Claude 모델의 신뢰성과 품질이 돋보입니다.',
      ...baseData,
    }
    claudeOutput = { data: claudeData, generated: true }
  }

  // 히스토리 아이템 생성
  const historyItem: HistoryItem = {
    id: Date.now().toString(),
    timestamp: new Date(),
    systemPrompt,
    userPrompt,
    schema,
    inputFields: [...inputFields],
    chatgptOutput,
    geminiOutput,
    claudeOutput,
    models: {
      ...(chatgpt.enabled && chatgpt.model ? { chatgpt: chatgpt.model } : {}),
      ...(gemini.enabled && gemini.model ? { gemini: gemini.model } : {}),
      ...(claude.enabled && claude.model ? { claude: claude.model } : {}),
    },
  }

  return { chatgptOutput, geminiOutput, claudeOutput, historyItem }
}
