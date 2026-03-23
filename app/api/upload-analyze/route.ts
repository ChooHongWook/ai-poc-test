/**
 * POST /api/upload-analyze Route Handler
 * FormData로 파일과 설정을 받아 LangChain 서비스 레이어로 분석 수행
 */
import { NextResponse } from 'next/server'
import { loadDocument } from '@/lib/langchain/document-loader'
import { createProviders } from '@/lib/langchain/ai-provider-factory'
import { analyzeDocuments } from '@/lib/langchain/analysis-chain'
import { UnsupportedFileTypeError } from '@/lib/langchain/types'
import type { AIOutput, HistoryItem, UploadAnalyzeConfig } from '@/lib/types'

// 파일 크기 제한: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// ProviderResult.provider 이름과 UploadAnalyzeResult 키 매핑
const PROVIDER_KEY_MAP: Record<
  string,
  'chatgptOutput' | 'geminiOutput' | 'claudeOutput'
> = {
  ChatOpenAI: 'chatgptOutput',
  ChatGoogleGenerativeAI: 'geminiOutput',
  ChatAnthropic: 'claudeOutput',
}

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: '요청 파싱에 실패했습니다' },
      { status: 400 },
    )
  }

  // 파일 목록 추출
  const files = formData.getAll('files') as File[]

  // 설정 파싱
  const configRaw = formData.get('config')
  const config = JSON.parse(
    typeof configRaw === 'string' ? configRaw : '{}',
  ) as UploadAnalyzeConfig

  // 파일 유효성 검사
  for (const file of files) {
    if (file.size === 0) {
      return NextResponse.json(
        { error: '빈 파일은 분석할 수 없습니다' },
        { status: 400 },
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기가 10MB를 초과합니다' },
        { status: 413 },
      )
    }
  }

  // AI 제공자 생성
  const { chatgpt, gemini, claude } = config
  const providers = createProviders({ chatgpt, gemini, claude })
  if (providers.length === 0) {
    return NextResponse.json(
      { error: '활성화된 AI 제공자가 없습니다. API 키를 설정하세요.' },
      { status: 400 },
    )
  }

  try {
    // 모든 파일을 Document[]로 변환
    const allDocuments = (
      await Promise.all(
        files.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer())
          return loadDocument({
            buffer,
            mimeType: file.type,
            fileName: file.name,
          })
        }),
      )
    ).flat()

    // 분석 체인 실행
    const analysisResponse = await analyzeDocuments({
      documents: allDocuments,
      providers,
      systemPrompt: config.systemPrompt || undefined,
      userPrompt: config.userPrompt || undefined,
    })

    // ProviderResult를 AIOutput 형태로 변환
    const outputs: Partial<
      Record<'chatgptOutput' | 'geminiOutput' | 'claudeOutput', AIOutput>
    > = {}

    for (const result of analysisResponse.results) {
      const key = PROVIDER_KEY_MAP[result.provider]
      if (!key) continue

      if (result.success) {
        // 구조화 출력 또는 텍스트를 Record<string, string>으로 변환
        const data: Record<string, string> = result.structuredOutput
          ? Object.fromEntries(
              Object.entries(result.structuredOutput).map(([k, v]) => [
                k,
                String(v),
              ]),
            )
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

    // 히스토리 아이템 생성
    const historyItem: HistoryItem = {
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

    return NextResponse.json({
      chatgptOutput: outputs.chatgptOutput,
      geminiOutput: outputs.geminiOutput,
      claudeOutput: outputs.claudeOutput,
      historyItem,
      ...(analysisResponse.truncated ? { truncated: true } : {}),
    })
  } catch (error) {
    if (error instanceof UnsupportedFileTypeError) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다' },
        { status: 400 },
      )
    }

    // 빈 파일 에러 (loadDocument에서 발생)
    if (error instanceof Error && error.message.includes('빈 파일')) {
      return NextResponse.json(
        { error: '빈 파일은 분석할 수 없습니다' },
        { status: 400 },
      )
    }

    console.error('[upload-analyze] 분석 중 오류:', error)
    return NextResponse.json(
      { error: '파일 분석 중 오류가 발생했습니다' },
      { status: 500 },
    )
  }
}
