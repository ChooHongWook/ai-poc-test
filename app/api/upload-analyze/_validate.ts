import { NextResponse } from 'next/server'
import { createProviders } from '@/lib/langchain/ai-provider-factory'
import type { ProviderConfig } from '@/lib/langchain/types'
import type { UploadAnalyzeConfig } from '@/lib/types'
import { jsonSchemaToZod } from '@/lib/langchain/schema-converter'
import type { ZodTypeAny } from 'zod'

// 파일 크기 제한: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

interface ValidatedRequest {
  files: File[]
  config: UploadAnalyzeConfig
  providers: ProviderConfig[]
  schema?: ZodTypeAny
}

type ValidationResult =
  | { success: true; data: ValidatedRequest }
  | { success: false; response: NextResponse }

/**
 * 업로드 분석 요청의 유효성을 검사하고 파싱된 데이터를 반환
 * FormData 파싱, 파일 검사, AI Provider 검사를 수행
 */
export async function validateUploadRequest(
  request: Request,
): Promise<ValidationResult> {
  // FormData 파싱
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: '요청 파싱에 실패했습니다' },
        { status: 400 },
      ),
    }
  }

  // 파일 목록 추출
  const files = formData.getAll('files') as File[]

  // 설정 파싱
  const configRaw = formData.get('config')
  const config = JSON.parse(
    typeof configRaw === 'string' ? configRaw : '{}',
  ) as UploadAnalyzeConfig

  // JSON Schema 문자열 → Zod 스키마 변환
  const schema = config.schema ? jsonSchemaToZod(config.schema) : undefined

  // 파일 유효성 검사
  for (const file of files) {
    if (file.size === 0) {
      return {
        success: false,
        response: NextResponse.json(
          { error: '빈 파일은 분석할 수 없습니다' },
          { status: 400 },
        ),
      }
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        response: NextResponse.json(
          { error: '파일 크기가 10MB를 초과합니다' },
          { status: 413 },
        ),
      }
    }
  }

  // AI 제공자 생성 및 검사
  const { chatgpt, gemini, claude } = config
  const providers = createProviders({ chatgpt, gemini, claude })
  if (providers.length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { error: '활성화된 AI 제공자가 없습니다. API 키를 설정하세요.' },
        { status: 400 },
      ),
    }
  }

  return { success: true, data: { files, config, providers, schema } }
}
