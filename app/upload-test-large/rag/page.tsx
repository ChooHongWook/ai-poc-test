'use client'

import { useState } from 'react'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { Database } from 'lucide-react'
import { DocumentPanel } from './_components/DocumentPanel'
import { ChatPanel } from './_components/ChatPanel'
import { SourcePanel } from './_components/SourcePanel'
import type { SearchSource } from '@/lib/api/rag'
import type { EmbeddingProvider } from '@/lib/langchain/embedding-factory'

export default function RagPage() {
  // 선택된 문서 ID 목록 (검색 범위 제한용)
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([])

  // 검색된 소스 (오른쪽 패널 표시용)
  const [sources, setSources] = useState<SearchSource[]>([])

  // 임베딩 제공자 (문서 패널과 채팅 패널에서 공유)
  const embeddingProvider: EmbeddingProvider = 'openai'

  return (
    <div className="bg-background flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <Toaster />

      {/* 페이지 헤더 */}
      <div className="border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h2 className="text-lg font-bold">RAG - 문서 기반 질의응답</h2>
          <Badge variant="secondary">pgvector</Badge>
        </div>
        <p className="text-muted-foreground text-xs">
          문서를 업로드하여 벡터 DB에 저장하고, 자연어로 질문하면 관련 문서를 검색하여 답변합니다
        </p>
      </div>

      {/* 3단 레이아웃 */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* 왼쪽: 문서 목록 + 업로드 */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <DocumentPanel
            selectedDocIds={selectedDocIds}
            onDocSelectionChange={setSelectedDocIds}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* 가운데: 채팅 Q&A */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <ChatPanel
            selectedDocIds={selectedDocIds}
            embeddingProvider={embeddingProvider}
            onSourcesUpdate={setSources}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* 오른쪽: 검색된 문서 청크 */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <SourcePanel sources={sources} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
