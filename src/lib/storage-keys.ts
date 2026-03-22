// localStorage 키 상수 정의 - 'aipoc_' 접두어로 충돌 방지
export const STORAGE_KEYS = {
  PROVIDER_CHATGPT: 'aipoc_provider_chatgpt',
  PROVIDER_GEMINI: 'aipoc_provider_gemini',
  PROVIDER_CLAUDE: 'aipoc_provider_claude',
  PROMPT_SYSTEM: 'aipoc_prompt_system',
  PROMPT_USER: 'aipoc_prompt_user',
  SCHEMA: 'aipoc_schema',
  INPUT_FIELDS: 'aipoc_inputfields',
} as const;
