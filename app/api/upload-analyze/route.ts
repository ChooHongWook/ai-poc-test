/**
 * POST /api/upload-analyze Route Handler
 * MSW가 비활성화된 환경(프로덕션/서버)에서의 폴백 핸들러
 */
import { NextResponse } from 'next/server'
import { analyzeUploadedFiles } from '@/lib/mock/upload-analyze'
import type { UploadAnalyzeParams } from '@/lib/mock/upload-analyze'

export async function POST(request: Request) {
  const params = (await request.json()) as UploadAnalyzeParams

  const result = await analyzeUploadedFiles(params)

  return NextResponse.json(result)
}
