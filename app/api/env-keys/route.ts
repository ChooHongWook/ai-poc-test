import { NextResponse } from 'next/server'

// .env에서 API 키를 읽어 반환하는 엔드포인트
export async function GET(): Promise<NextResponse> {
  const openaiKey =
    process.env.OPENAI_API_KEY || ''
  const geminiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
  const claudeKey =
    process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || ''

  return NextResponse.json({
    openai: openaiKey,
    gemini: geminiKey,
    claude: claudeKey,
  })
}
