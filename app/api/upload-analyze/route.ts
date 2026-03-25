/**
 * POST /api/upload-analyze Route Handler
 * FormData로 파일과 설정을 받아 LangChain 서비스 레이어로 분석 수행
 */
import { NextResponse } from 'next/server'
import { loadDocument } from '@/lib/langchain/document-loader'
import { analyzeDocuments } from '@/lib/langchain/analysis-chain'
import { UnsupportedFileTypeError } from '@/lib/langchain/types'
import { getHistoryItem, getOutputs } from './_utils'
import { validateUploadRequest } from './_validate'

export async function POST(request: Request) {
  const validation = await validateUploadRequest(request)
  if (!validation.success) return validation.response

  const { files, config, providers } = validation.data

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
    const outputs = getOutputs(analysisResponse.results)

    // 히스토리 아이템 생성
    const historyItem = getHistoryItem(files, config, outputs)

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
