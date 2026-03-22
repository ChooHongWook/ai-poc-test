'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { AIOutput, HistoryItem } from '@/lib/types'

// HistoryItem 및 AIOutput 타입은 lib/types.ts에서 가져옴
export type { HistoryItem, AIOutput }

// 직렬화된 히스토리 아이템 (로컬스토리지용)
interface SerializedHistoryItem extends Omit<HistoryItem, 'timestamp'> {
  timestamp: string
}

// 히스토리 컨텍스트 타입
interface HistoryContextType {
  history: HistoryItem[]
  addHistory: (item: HistoryItem) => void
  clearHistory: () => void
}

const HistoryContext = createContext<HistoryContextType | null>(null)

// 로컬스토리지에서 히스토리 불러오기
function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('ai-history')
    if (!stored) return []
    const parsed = JSON.parse(stored) as SerializedHistoryItem[]
    return parsed.map((item) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }))
  } catch {
    return []
  }
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([])

  // 마운트 시 로컬스토리지에서 히스토리 불러오기
  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const addHistory = (item: HistoryItem) => {
    const newHistory = [item, ...history]
    setHistory(newHistory)
    localStorage.setItem('ai-history', JSON.stringify(newHistory))
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('ai-history')
  }

  return (
    <HistoryContext.Provider value={{ history, addHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  )
}

// 히스토리 컨텍스트 훅
export function useHistory(): HistoryContextType {
  const context = useContext(HistoryContext)
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider')
  }
  return context
}
