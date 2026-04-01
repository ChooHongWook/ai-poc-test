'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileSearch, BookOpen } from 'lucide-react'
import type { SearchSource } from '@/lib/api/rag'

interface SourcePanelProps {
  sources: SearchSource[]
}

export function SourcePanel({ sources }: SourcePanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <h3 className="text-sm font-semibold">검색된 문서 청크</h3>
          {sources.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {sources.length}개
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          질의와 유사한 문서 청크가 표시됩니다
        </p>
      </div>

      {/* 소스 목록 */}
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4">
          {sources.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
              <FileSearch className="mb-3 h-10 w-10 opacity-50" />
              <p className="text-sm font-medium">검색 결과 없음</p>
              <p className="text-xs">질문을 입력하면 관련 문서가 여기에 표시됩니다</p>
            </div>
          ) : (
            sources.map((source, index) => (
              <Card key={index} className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs">
                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded px-1.5 py-0.5 font-mono">
                      #{index + 1}
                    </span>
                    <Badge
                      variant={source.score > 0.8 ? 'default' : source.score > 0.5 ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      유사도 {(source.score * 100).toFixed(1)}%
                    </Badge>
                    <span className="text-muted-foreground ml-auto text-xs">
                      문서 #{source.documentId} · 청크 #{source.chunkIndex}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-6 whitespace-pre-wrap text-xs leading-relaxed">
                    {source.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
