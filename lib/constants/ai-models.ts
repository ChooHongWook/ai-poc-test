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
  GPT_5_5: { value: 'gpt-5.5', label: 'GPT-5.5' },
  GPT_5_4: { value: 'gpt-5.4', label: 'GPT-5.4' },
  GPT_5_4_MINI: { value: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
  GPT_5_4_NANO: { value: 'gpt-5.4-nano', label: 'GPT-5.4 nano' },
} as const

export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS]['value']

export const OPENAI_DEFAULT_MODEL: OpenAIModel = OPENAI_MODELS.GPT_5_4_MINI.value

export const OPENAI_MODEL_OPTIONS: ModelOption[] = [
  OPENAI_MODELS.GPT_5_5,
  OPENAI_MODELS.GPT_5_4,
  OPENAI_MODELS.GPT_5_4_MINI,
  OPENAI_MODELS.GPT_5_4_NANO,
]

// ─── Google Gemini ───────────────────────────────────────
// 모델 목록 출처: Google Gemini API 공식 문서
// https://ai.google.dev/gemini-api/docs/models (2026-06 기준 stable + preview)
export const GEMINI_MODELS = {
  GEMINI_3_5_FLASH: { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  GEMINI_3_1_PRO_PREVIEW: { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Preview)' },
  GEMINI_3_1_FLASH_LITE: { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
  GEMINI_3_FLASH_PREVIEW: { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)' },
  GEMINI_2_5_PRO: { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  GEMINI_2_5_FLASH: { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  GEMINI_2_5_FLASH_LITE: { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
} as const

export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS]['value']

export const GEMINI_DEFAULT_MODEL: GeminiModel = GEMINI_MODELS.GEMINI_2_5_FLASH.value

export const GEMINI_MODEL_OPTIONS: ModelOption[] = [
  GEMINI_MODELS.GEMINI_3_5_FLASH,
  GEMINI_MODELS.GEMINI_3_1_PRO_PREVIEW,
  GEMINI_MODELS.GEMINI_3_1_FLASH_LITE,
  GEMINI_MODELS.GEMINI_3_FLASH_PREVIEW,
  GEMINI_MODELS.GEMINI_2_5_PRO,
  GEMINI_MODELS.GEMINI_2_5_FLASH,
  GEMINI_MODELS.GEMINI_2_5_FLASH_LITE,
]

// ─── Anthropic Claude ────────────────────────────────────
// 모델 목록 출처: Anthropic Claude 공식 문서
// https://platform.claude.com/docs/ko/about-claude/models/overview
// (2026-06 기준 최신 + 사용 가능 레거시. 폐기 예정 Sonnet 4/Opus 4/Haiku 3 제외)
export const CLAUDE_MODELS = {
  CLAUDE_OPUS_4_7: { value: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
  CLAUDE_SONNET_4_6: { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  CLAUDE_HAIKU_45: { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  CLAUDE_OPUS_4_6: { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
  CLAUDE_OPUS_4_5: { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5' },
  CLAUDE_SONNET_4_5: { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
  CLAUDE_OPUS_4_1: { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1' },
} as const

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS]['value']

export const CLAUDE_DEFAULT_MODEL: ClaudeModel = CLAUDE_MODELS.CLAUDE_SONNET_4_6.value

export const CLAUDE_MODEL_OPTIONS: ModelOption[] = [
  CLAUDE_MODELS.CLAUDE_OPUS_4_7,
  CLAUDE_MODELS.CLAUDE_SONNET_4_6,
  CLAUDE_MODELS.CLAUDE_HAIKU_45,
  CLAUDE_MODELS.CLAUDE_OPUS_4_6,
  CLAUDE_MODELS.CLAUDE_OPUS_4_5,
  CLAUDE_MODELS.CLAUDE_SONNET_4_5,
  CLAUDE_MODELS.CLAUDE_OPUS_4_1,
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
