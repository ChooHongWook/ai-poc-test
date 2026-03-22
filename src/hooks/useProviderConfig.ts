'use client';
// AI 프로바이더 설정 관리 훅 - enabled/model은 localStorage에 저장, API Key는 메모리만
import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export interface AIProvider {
  enabled: boolean;
  apiKey: string;
  model: string;
}

interface ProviderPersistedConfig {
  enabled: boolean;
  model: string;
}

export function useProviderConfig() {
  // enabled, model은 localStorage에 영속화
  const [chatgptConfig, setChatGPTConfig] =
    useLocalStorage<ProviderPersistedConfig>(STORAGE_KEYS.PROVIDER_CHATGPT, {
      enabled: false,
      model: '',
    });
  const [geminiConfig, setGeminiConfig] =
    useLocalStorage<ProviderPersistedConfig>(STORAGE_KEYS.PROVIDER_GEMINI, {
      enabled: false,
      model: '',
    });
  const [claudeConfig, setClaudeConfig] =
    useLocalStorage<ProviderPersistedConfig>(STORAGE_KEYS.PROVIDER_CLAUDE, {
      enabled: false,
      model: '',
    });

  // API Key는 메모리에만 유지 (보안)
  const [chatgptKey, setChatGPTKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');

  // 통합 getter - AIProvider 인터페이스로 반환
  const chatgpt: AIProvider = { ...chatgptConfig, apiKey: chatgptKey };
  const gemini: AIProvider = { ...geminiConfig, apiKey: geminiKey };
  const claude: AIProvider = { ...claudeConfig, apiKey: claudeKey };

  // 통합 setter - AIProvider를 받아서 분리 저장
  const setChatGPT = useCallback(
    (value: AIProvider) => {
      setChatGPTConfig({ enabled: value.enabled, model: value.model });
      setChatGPTKey(value.apiKey);
    },
    [setChatGPTConfig],
  );

  const setGemini = useCallback(
    (value: AIProvider) => {
      setGeminiConfig({ enabled: value.enabled, model: value.model });
      setGeminiKey(value.apiKey);
    },
    [setGeminiConfig],
  );

  const setClaude = useCallback(
    (value: AIProvider) => {
      setClaudeConfig({ enabled: value.enabled, model: value.model });
      setClaudeKey(value.apiKey);
    },
    [setClaudeConfig],
  );

  return { chatgpt, gemini, claude, setChatGPT, setGemini, setClaude };
}
