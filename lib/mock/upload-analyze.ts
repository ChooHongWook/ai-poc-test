import type { AIProvider } from '@/lib/providers/ai-config-provider'
import type { AIOutput, HistoryItem } from '@/lib/types'

// 파일 업로드 분석 요청 파라미터
export interface UploadAnalyzeParams {
  chatgpt: AIProvider
  gemini: AIProvider
  claude: AIProvider
  systemPrompt: string
  userPrompt: string
  schema: string
  fileNames: string[]
  fileSizes: string[]
  fileTypes: string[]
}

// 파일 업로드 분석 결과
export interface UploadAnalyzeResult {
  chatgptOutput?: AIOutput
  geminiOutput?: AIOutput
  claudeOutput?: AIOutput
  historyItem: HistoryItem
}

// 파일 분석 Mock 생성 함수 (2초 지연 후 목업 데이터 반환)
export async function analyzeUploadedFiles(
  params: UploadAnalyzeParams,
): Promise<UploadAnalyzeResult> {
  const {
    chatgpt,
    gemini,
    claude,
    systemPrompt,
    userPrompt,
    schema,
    fileNames,
    fileSizes,
    fileTypes,
  } = params

  // API 호출 시뮬레이션 (2초 지연)
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const fileCount = fileNames.length
  const fileList = fileNames.join(', ')

  let chatgptOutput: AIOutput | undefined
  let geminiOutput: AIOutput | undefined
  let claudeOutput: AIOutput | undefined

  if (chatgpt.enabled) {
    chatgptOutput = {
      data: {
        분석모델: `ChatGPT (${chatgpt.model})`,
        '파일 수': `${fileCount}개`,
        '파일 목록': fileList,
        '파일 형식': [...new Set(fileTypes)].join(', ') || '알 수 없음',
        분석결과:
          'ChatGPT가 업로드된 파일을 분석했습니다. 문서 구조와 핵심 내용을 파악했습니다.',
        '처리 상태': '분석 완료',
      },
      generated: true,
    }
  }

  if (gemini.enabled) {
    geminiOutput = {
      data: {
        분석모델: `Gemini (${gemini.model})`,
        '파일 수': `${fileCount}개`,
        '파일 목록': fileList,
        '파일 형식': [...new Set(fileTypes)].join(', ') || '알 수 없음',
        분석결과:
          'Gemini가 멀티모달 분석을 수행했습니다. 이미지와 텍스트 모두 처리 가능합니다.',
        '처리 상태': '분석 완료',
      },
      generated: true,
    }
  }

  if (claude.enabled) {
    claudeOutput = {
      data: {
        분석모델: `Claude (${claude.model})`,
        '파일 수': `${fileCount}개`,
        '파일 목록': fileList,
        '파일 형식': [...new Set(fileTypes)].join(', ') || '알 수 없음',
        분석결과:
          'Claude가 안전하고 정확하게 파일 내용을 분석했습니다. 상세한 구조 분석 결과를 제공합니다.',
        '처리 상태': '분석 완료',
      },
      generated: true,
    }
  }

  const historyItem: HistoryItem = {
    id: Date.now().toString(),
    timestamp: new Date(),
    systemPrompt,
    userPrompt: userPrompt || `[파일 분석] ${fileList}`,
    schema,
    inputFields: fileNames.map((name, i) => ({
      id: `file-${i}`,
      label: name,
      value: fileSizes[i] ?? '',
    })),
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
