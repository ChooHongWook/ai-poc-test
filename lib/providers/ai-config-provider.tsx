'use client'

import { createContext, useContext, useState, useEffect } from 'react'

// AI 제공자 설정 타입
export interface AIProvider {
  enabled: boolean
  apiKey: string
  model: string
}

// AI 설정 컨텍스트 타입
interface AIConfigContextType {
  chatgpt: AIProvider
  gemini: AIProvider
  claude: AIProvider
  setChatGPT: (provider: AIProvider) => void
  setGemini: (provider: AIProvider) => void
  setClaude: (provider: AIProvider) => void
}

const defaultProvider: AIProvider = {
  enabled: false,
  apiKey: '',
  model: '',
}

const AIConfigContext = createContext<AIConfigContextType | null>(null)

// AI 설정 상태를 로컬스토리지에서 불러오는 헬퍼 함수
function loadFromStorage(key: string, defaultValue: AIProvider): AIProvider {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as AIProvider) : defaultValue
  } catch {
    return defaultValue
  }
}

export function AIConfigProvider({ children }: { children: React.ReactNode }) {
  const [chatgpt, setChatGPTState] = useState<AIProvider>(defaultProvider)
  const [gemini, setGeminiState] = useState<AIProvider>(defaultProvider)
  const [claude, setClaudeState] = useState<AIProvider>(defaultProvider)

  // 마운트 시 로컬스토리지에서 설정 불러오기
  useEffect(() => {
    setChatGPTState(loadFromStorage('ai-config-chatgpt', defaultProvider))
    setGeminiState(loadFromStorage('ai-config-gemini', defaultProvider))
    setClaudeState(loadFromStorage('ai-config-claude', defaultProvider))
  }, [])

  const setChatGPT = (provider: AIProvider) => {
    setChatGPTState(provider)
    localStorage.setItem('ai-config-chatgpt', JSON.stringify(provider))
  }

  const setGemini = (provider: AIProvider) => {
    setGeminiState(provider)
    localStorage.setItem('ai-config-gemini', JSON.stringify(provider))
  }

  const setClaude = (provider: AIProvider) => {
    setClaudeState(provider)
    localStorage.setItem('ai-config-claude', JSON.stringify(provider))
  }

  return (
    <AIConfigContext.Provider
      value={{ chatgpt, gemini, claude, setChatGPT, setGemini, setClaude }}
    >
      {children}
    </AIConfigContext.Provider>
  )
}

// AI 설정 컨텍스트 훅
export function useAIConfig(): AIConfigContextType {
  const context = useContext(AIConfigContext)
  if (!context) {
    throw new Error('useAIConfig must be used within AIConfigProvider')
  }
  return context
}
