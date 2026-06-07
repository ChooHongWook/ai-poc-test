// AI 제공자별 사용 가능 모델 및 기본값 정의

export interface ModelOption {
  value: string
  label: string
}

// ─── OpenAI (ChatGPT) ────────────────────────────────────
export const OPENAI_MODELS = {
  GPT_5: 'gpt-5',
  GPT_5_MINI: 'gpt-5-mini',
  GPT_4_1: 'gpt-4.1',
  GPT_4_1_MINI: 'gpt-4.1-mini',
  GPT_4_1_NANO: 'gpt-4.1-nano',
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  O3: 'o3',
  O4_MINI: 'o4-mini',
  O3_MINI: 'o3-mini',
  O1: 'o1',
} as const

export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS]

export const OPENAI_DEFAULT_MODEL: OpenAIModel = OPENAI_MODELS.GPT_4O_MINI

export const OPENAI_MODEL_OPTIONS: ModelOption[] = [
  { value: OPENAI_MODELS.GPT_5, label: 'GPT-5' },
  { value: OPENAI_MODELS.GPT_5_MINI, label: 'GPT-5 Mini' },
  { value: OPENAI_MODELS.GPT_4_1, label: 'GPT-4.1' },
  { value: OPENAI_MODELS.GPT_4_1_MINI, label: 'GPT-4.1 Mini' },
  { value: OPENAI_MODELS.GPT_4_1_NANO, label: 'GPT-4.1 Nano' },
  { value: OPENAI_MODELS.GPT_4O, label: 'GPT-4o' },
  { value: OPENAI_MODELS.GPT_4O_MINI, label: 'GPT-4o Mini' },
  { value: OPENAI_MODELS.O3, label: 'o3' },
  { value: OPENAI_MODELS.O4_MINI, label: 'o4-mini' },
  { value: OPENAI_MODELS.O3_MINI, label: 'o3-mini' },
  { value: OPENAI_MODELS.O1, label: 'o1' },
]

// ─── Google Gemini ───────────────────────────────────────
export const GEMINI_MODELS = {
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite',
  GEMINI_2_0_FLASH: 'gemini-2.0-flash',
  GEMINI_2_0_FLASH_LITE: 'gemini-2.0-flash-lite',
  GEMINI_1_5_PRO: 'gemini-1.5-pro',
  GEMINI_1_5_FLASH: 'gemini-1.5-flash',
} as const

export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS]

export const GEMINI_DEFAULT_MODEL: GeminiModel = GEMINI_MODELS.GEMINI_2_0_FLASH

export const GEMINI_MODEL_OPTIONS: ModelOption[] = [
  { value: GEMINI_MODELS.GEMINI_2_5_PRO, label: 'Gemini 2.5 Pro' },
  { value: GEMINI_MODELS.GEMINI_2_5_FLASH, label: 'Gemini 2.5 Flash' },
  { value: GEMINI_MODELS.GEMINI_2_5_FLASH_LITE, label: 'Gemini 2.5 Flash Lite' },
  { value: GEMINI_MODELS.GEMINI_2_0_FLASH, label: 'Gemini 2.0 Flash' },
  { value: GEMINI_MODELS.GEMINI_2_0_FLASH_LITE, label: 'Gemini 2.0 Flash Lite' },
  { value: GEMINI_MODELS.GEMINI_1_5_PRO, label: 'Gemini 1.5 Pro' },
  { value: GEMINI_MODELS.GEMINI_1_5_FLASH, label: 'Gemini 1.5 Flash' },
]

// ─── Anthropic Claude ────────────────────────────────────
export const CLAUDE_MODELS = {
  CLAUDE_OPUS_4_1: 'claude-opus-4-1-20250805',
  CLAUDE_OPUS_4: 'claude-opus-4-20250514',
  CLAUDE_SONNET_4_5: 'claude-sonnet-4-5-20250929',
  CLAUDE_SONNET_4: 'claude-sonnet-4-20250514',
  CLAUDE_3_7_SONNET: 'claude-3-7-sonnet-20250219',
  CLAUDE_HAIKU_45: 'claude-haiku-4-5-20251001',
  CLAUDE_HAIKU_35: 'claude-3-5-haiku-20241022',
} as const

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS]

export const CLAUDE_DEFAULT_MODEL: ClaudeModel = CLAUDE_MODELS.CLAUDE_SONNET_4

export const CLAUDE_MODEL_OPTIONS: ModelOption[] = [
  { value: CLAUDE_MODELS.CLAUDE_OPUS_4_1, label: 'Claude Opus 4.1' },
  { value: CLAUDE_MODELS.CLAUDE_OPUS_4, label: 'Claude Opus 4' },
  { value: CLAUDE_MODELS.CLAUDE_SONNET_4_5, label: 'Claude Sonnet 4.5' },
  { value: CLAUDE_MODELS.CLAUDE_SONNET_4, label: 'Claude Sonnet 4' },
  { value: CLAUDE_MODELS.CLAUDE_3_7_SONNET, label: 'Claude 3.7 Sonnet' },
  { value: CLAUDE_MODELS.CLAUDE_HAIKU_45, label: 'Claude Haiku 4.5' },
  { value: CLAUDE_MODELS.CLAUDE_HAIKU_35, label: 'Claude 3.5 Haiku' },
]

// ─── 기본 모델 맵 ────────────────────────────────────────
export const DEFAULT_MODELS = {
  chatgpt: OPENAI_DEFAULT_MODEL,
  gemini: GEMINI_DEFAULT_MODEL,
  claude: CLAUDE_DEFAULT_MODEL,
} as const
