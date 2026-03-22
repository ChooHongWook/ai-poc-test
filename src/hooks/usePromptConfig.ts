'use client';
// 프롬프트 설정 관리 훅 - 마지막 사용한 프롬프트를 localStorage에 자동 저장
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export function usePromptConfig() {
  const [systemPrompt, setSystemPrompt] = useLocalStorage<string>(
    STORAGE_KEYS.PROMPT_SYSTEM,
    '',
  );
  const [userPrompt, setUserPrompt] = useLocalStorage<string>(
    STORAGE_KEYS.PROMPT_USER,
    '',
  );
  const [schema, setSchema] = useLocalStorage<string>(STORAGE_KEYS.SCHEMA, '');

  return {
    systemPrompt,
    userPrompt,
    schema,
    setSystemPrompt,
    setUserPrompt,
    setSchema,
  };
}
