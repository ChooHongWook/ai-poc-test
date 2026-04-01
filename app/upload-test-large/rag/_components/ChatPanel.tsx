'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Send,
  Loader2,
  Bot,
  User,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAIConfig } from '@/lib/providers/ai-config-provider'
import {
  startQuery,
  generateMessageId,
  type ChatMessage,
  type SearchSource,
} from '@/lib/api/rag'
import type { EmbeddingProvider } from '@/lib/langchain/embedding-factory'

// 제공자 표시 이름 매핑
const PROVIDER_DISPLAY: Record<string, string> = {
  ChatOpenAI: 'ChatGPT',
  ChatGoogleGenerativeAI: 'Gemini',
  ChatAnthropic: 'Claude',
}

interface ChatPanelProps {
  selectedDocIds: number[]
  embeddingProvider: EmbeddingProvider
  onSourcesUpdate: (sources: SearchSource[]) => void
}

export function ChatPanel({
  selectedDocIds,
  embeddingProvider,
  onSourcesUpdate,
}: ChatPanelProps) {
  const { chatgpt, gemini, claude } = useAIConfig()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isQuerying, setIsQuerying] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 임베딩 API 키
  const embeddingApiKey =
    embeddingProvider === 'openai' ? chatgpt.apiKey : gemini.apiKey

  // 스크롤 자동 하단 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  // 질의 실행
  const handleSubmit = () => {
    const query = input.trim()
    if (!query || isQuerying) return

    if (!embeddingApiKey) {
      toast.error('임베딩 제공자의 API 키를 설정해주세요')
      return
    }

    if (!chatgpt.enabled && !gemini.enabled && !claude.enabled) {
      toast.error('AI 모델을 하나 이상 활성화해주세요')
      return
    }

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsQuerying(true)
    setStreamingContent('')
    onSourcesUpdate([])

    let accumulatedContent = ''

    startQuery({
      query,
      embeddingProvider,
      embeddingApiKey,
      chatgpt,
      gemini,
      claude,
      documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      topK: 5,
      onProgress: () => {
        // 진행 상태는 UI에서 자체적으로 표시
      },
      onSources: (sources) => {
        onSourcesUpdate(sources)
      },
      onToken: (token) => {
        accumulatedContent += token
        setStreamingContent(accumulatedContent)
      },
      onDone: (provider) => {
        // 스트리밍 완료 → 메시지 목록에 추가
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: accumulatedContent,
          provider: PROVIDER_DISPLAY[provider] ?? provider,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        setStreamingContent('')
        setIsQuerying(false)
      },
      onError: (error) => {
        toast.error(error)
        setIsQuerying(false)
        setStreamingContent('')
      },
    })
  }

  // Enter 키 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <h3 className="text-sm font-semibold">RAG Q&A</h3>
          {selectedDocIds.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {selectedDocIds.length}개 문서 선택
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          문서를 기반으로 질문하세요. 선택된 문서만 검색합니다.
        </p>
      </div>

      {/* 메시지 영역 */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="space-y-4 p-4">
          {messages.length === 0 && !isQuerying && (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
              <Bot className="mb-3 h-10 w-10 opacity-50" />
              <p className="text-sm font-medium">문서 기반 Q&A</p>
              <p className="text-xs">
                왼쪽에서 문서를 업로드하고 질문을 입력하세요
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {msg.role === 'assistant' && (
                <div className="bg-primary/10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted',
                )}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                {msg.provider && (
                  <p className="text-muted-foreground mt-1 text-xs opacity-70">
                    {msg.provider}
                  </p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="bg-muted flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* 스트리밍 중인 답변 */}
          {isQuerying && (
            <div className="flex gap-3">
              <div className="bg-primary/10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted max-w-[80%] rounded-lg px-3 py-2">
                {streamingContent ? (
                  <p className="whitespace-pre-wrap text-sm">{streamingContent}</p>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    문서 검색 중...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 입력 영역 */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="문서에 대해 질문하세요..."
            className="border-input bg-background placeholder:text-muted-foreground flex-1 resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isQuerying}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isQuerying}
            size="icon"
            className="h-auto self-end"
          >
            {isQuerying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
