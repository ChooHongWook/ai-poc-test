// AI 제공자별 사용 가능 모델 및 기본값 정의

export interface ModelOption {
  value: string
  label: string
}

// ─── OpenAI (ChatGPT) ────────────────────────────────────
// 모델 목록 출처: OpenAI 공식 API 문서
// https://developers.openai.com/api/docs/models (2026-06 기준 frontier 모델)
// 그 외 이전 세대 모델은 설정 화면의 "기타" 직접 입력으로 사용 가능
export const OPENAI_MODELS = {
  GPT_5_5: 'gpt-5.5',
  GPT_5_4: 'gpt-5.4',
  GPT_5_4_MINI: 'gpt-5.4-mini',
  GPT_5_4_NANO: 'gpt-5.4-nano',
} as const

export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS]

export const OPENAI_DEFAULT_MODEL: OpenAIModel = OPENAI_MODELS.GPT_5_4_MINI

export const OPENAI_MODEL_OPTIONS: ModelOption[] = [
  { value: OPENAI_MODELS.GPT_5_5, label: 'GPT-5.5' },
  { value: OPENAI_MODELS.GPT_5_4, label: 'GPT-5.4' },
  { value: OPENAI_MODELS.GPT_5_4_MINI, label: 'GPT-5.4 mini' },
  { value: OPENAI_MODELS.GPT_5_4_NANO, label: 'GPT-5.4 nano' },
]

// ─── Google Gemini ───────────────────────────────────────
// 모델 목록 출처: Google Gemini API 공식 문서
// https://ai.google.dev/gemini-api/docs/models (2026-06 기준 stable + preview)
export const GEMINI_MODELS = {
  GEMINI_3_5_FLASH: 'gemini-3.5-flash',
  GEMINI_3_1_PRO_PREVIEW: 'gemini-3.1-pro-preview',
  GEMINI_3_1_FLASH_LITE: 'gemini-3.1-flash-lite',
  GEMINI_3_FLASH_PREVIEW: 'gemini-3-flash-preview',
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite',
} as const

export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS]

export const GEMINI_DEFAULT_MODEL: GeminiModel = GEMINI_MODELS.GEMINI_2_5_FLASH

export const GEMINI_MODEL_OPTIONS: ModelOption[] = [
  { value: GEMINI_MODELS.GEMINI_3_5_FLASH, label: 'Gemini 3.5 Flash' },
  { value: GEMINI_MODELS.GEMINI_3_1_PRO_PREVIEW, label: 'Gemini 3.1 Pro (Preview)' },
  { value: GEMINI_MODELS.GEMINI_3_1_FLASH_LITE, label: 'Gemini 3.1 Flash Lite' },
  { value: GEMINI_MODELS.GEMINI_3_FLASH_PREVIEW, label: 'Gemini 3 Flash (Preview)' },
  { value: GEMINI_MODELS.GEMINI_2_5_PRO, label: 'Gemini 2.5 Pro' },
  { value: GEMINI_MODELS.GEMINI_2_5_FLASH, label: 'Gemini 2.5 Flash' },
  { value: GEMINI_MODELS.GEMINI_2_5_FLASH_LITE, label: 'Gemini 2.5 Flash Lite' },
]

// ─── Anthropic Claude ────────────────────────────────────
// 모델 목록 출처: Anthropic Claude 공식 문서
// https://platform.claude.com/docs/ko/about-claude/models/overview
// (2026-06 기준 최신 + 사용 가능 레거시. 폐기 예정 Sonnet 4/Opus 4/Haiku 3 제외)
export const CLAUDE_MODELS = {
  CLAUDE_OPUS_4_7: 'claude-opus-4-7',
  CLAUDE_SONNET_4_6: 'claude-sonnet-4-6',
  CLAUDE_HAIKU_45: 'claude-haiku-4-5-20251001',
  CLAUDE_OPUS_4_6: 'claude-opus-4-6',
  CLAUDE_OPUS_4_5: 'claude-opus-4-5-20251101',
  CLAUDE_SONNET_4_5: 'claude-sonnet-4-5-20250929',
  CLAUDE_OPUS_4_1: 'claude-opus-4-1-20250805',
} as const

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS]

export const CLAUDE_DEFAULT_MODEL: ClaudeModel = CLAUDE_MODELS.CLAUDE_SONNET_4_6

export const CLAUDE_MODEL_OPTIONS: ModelOption[] = [
  { value: CLAUDE_MODELS.CLAUDE_OPUS_4_7, label: 'Claude Opus 4.7' },
  { value: CLAUDE_MODELS.CLAUDE_SONNET_4_6, label: 'Claude Sonnet 4.6' },
  { value: CLAUDE_MODELS.CLAUDE_HAIKU_45, label: 'Claude Haiku 4.5' },
  { value: CLAUDE_MODELS.CLAUDE_OPUS_4_6, label: 'Claude Opus 4.6' },
  { value: CLAUDE_MODELS.CLAUDE_OPUS_4_5, label: 'Claude Opus 4.5' },
  { value: CLAUDE_MODELS.CLAUDE_SONNET_4_5, label: 'Claude Sonnet 4.5' },
  { value: CLAUDE_MODELS.CLAUDE_OPUS_4_1, label: 'Claude Opus 4.1' },
]

// ─── 기본 모델 맵 ────────────────────────────────────────
export const DEFAULT_MODELS = {
  chatgpt: OPENAI_DEFAULT_MODEL,
  gemini: GEMINI_DEFAULT_MODEL,
  claude: CLAUDE_DEFAULT_MODEL,
} as const

// ─── 모델 목록 공식 문서 출처 ────────────────────────────
// 위 각 provider 섹션 주석과 동일한 출처. UI(/settings)에서도 링크로 노출
export const MODEL_SOURCE_DOCS: Record<
  'chatgpt' | 'gemini' | 'claude',
  { label: string; url: string }
> = {
  chatgpt: {
    label: 'OpenAI 공식 모델 문서',
    url: 'https://developers.openai.com/api/docs/models',
  },
  gemini: {
    label: 'Gemini API 공식 모델 문서',
    url: 'https://ai.google.dev/gemini-api/docs/models',
  },
  claude: {
    label: 'Claude 공식 모델 문서',
    url: 'https://platform.claude.com/docs/ko/about-claude/models/overview',
  },
}
