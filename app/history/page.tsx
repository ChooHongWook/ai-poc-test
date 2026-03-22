'use client'

import { useHistory } from '@/lib/providers/history-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// 히스토리 목록 페이지
export default function HistoryPage() {
  const { history, clearHistory } = useHistory()

  if (history.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">생성 히스토리</h2>
        </div>
        <p className="text-muted-foreground">아직 생성된 히스토리가 없습니다.</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">생성 히스토리</h2>
        <Button variant="outline" onClick={clearHistory}>
          전체 삭제
        </Button>
      </div>
      <div className="space-y-4">
        {history.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {new Date(item.timestamp).toLocaleString('ko-KR')}
                </CardTitle>
                <div className="flex gap-2">
                  {item.chatgptOutput && (
                    <Badge variant="secondary">ChatGPT</Badge>
                  )}
                  {item.geminiOutput && (
                    <Badge variant="secondary">Gemini</Badge>
                  )}
                  {item.claudeOutput && (
                    <Badge variant="secondary">Claude</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.userPrompt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
