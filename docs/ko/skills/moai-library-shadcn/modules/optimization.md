# shadcn/ui 성능 최적화

## 번들 크기 최적화

### 코드 분할 전략

패턴: 컴포넌트 지연 로딩

```typescript
import React from "react"

// 무거운 컴포넌트를 지연 로드
const DataTableComponent = React.lazy(() =>
 import("@/components/data-table").then(mod => ({ default: mod.DataTable }))
)

export function Dashboard() {
 return (
 <React.Suspense fallback={<p>로딩 중...</p>}>
 <DataTableComponent />
 </React.Suspense>
 )
}
```

### CSS 파일 크기 최적화

shadcn/ui는 Tailwind CSS를 사용합니다. 다음 방법으로 CSS 출력을 최적화하세요:

1. `tailwind.config.ts`에서 사용하지 않는 스타일 제거:

```typescript
export default {
 content: [
 "./app//*.{js,ts,jsx,tsx}",
 "./components//*.{js,ts,jsx,tsx}",
 ],
 // 템플릿에서 사용된 스타일만 포함
}
```

2. 사용하지 않는 컴포넌트 트리 셰이킹 - 필요한 것만 임포트:

```typescript
// 좋음: 특정 컴포넌트만 임포트
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// 피해야 함: 전체 컴포넌트 라이브러리 임포트
import * as UI from "@/components/ui"
```

### 컴포넌트 임포트 최적화

```typescript
// 최적화된 임포트
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function Form() {
 return (
 <>
 <Input placeholder="이름" />
 <Button>제출</Button>
 </>
 )
}
```

## 렌더링 최적화

### 컴포넌트를 위한 React.memo

```typescript
import React from "react"
import { Card } from "@/components/ui/card"

interface ItemProps {
 id: string
 title: string
 description: string
}

// props가 변경되지 않았을 때 리렌더링 방지
export const ListItem = React.memo(function ListItem({ id, title, description }: ItemProps) {
 return (
 <Card className="p-4">
 <h3>{title}</h3>
 <p>{description}</p>
 </Card>
 )
}, (prevProps, nextProps) => {
 // 커스텀 비교
 return prevProps.id === nextProps.id &&
 prevProps.title === nextProps.title &&
 prevProps.description === nextProps.description
})
```

### 비용이 큰 계산을 위한 useMemo

```typescript
import React, { useMemo } from "react"
import { Button } from "@/components/ui/button"

interface DataTableProps {
 rows: any[]
 filter: string
}

export function DataTable({ rows, filter }: DataTableProps) {
 // 필터링 결과를 메모이제이션
 const filteredRows = useMemo(() => {
 return rows.filter(row => row.name.includes(filter))
 }, [rows, filter])

 return (
 <div>
 {filteredRows.map(row => (
 <div key={row.id}>{row.name}</div>
 ))}
 </div>
 )
}
```

### 이벤트 핸들러를 위한 useCallback

```typescript
import React, { useCallback } from "react"
import { Button } from "@/components/ui/button"

export function Form() {
 const handleSubmit = useCallback((e: React.FormEvent) => {
 e.preventDefault()
 // 비용이 큰 작업
 }, [])

 return (
 <form onSubmit={handleSubmit}>
 <Button type="submit">제출</Button>
 </form>
 )
}
```

## 토큰 효율성

### CSS 변수 최적화

```typescript
// 효율적인 디자인 토큰 사용
const tokenConfig = {
 colors: {
 primary: "hsl(var(--primary))",
 secondary: "hsl(var(--secondary))",
 },
 spacing: {
 xs: "var(--spacing-xs)",
 sm: "var(--spacing-sm)",
 },
}

// 컴포넌트에서 사용
export function Button() {
 return (
 <button className="bg-[var(--primary)] px-[var(--spacing-sm)]">
 클릭하세요
 </button>
 )
}
```

## 렌더링 최적화

### 대규모 리스트를 위한 가상 스크롤링

```typescript
import React, { useMemo } from "react"
import { FixedSizeList } from "react-window"
import { Card } from "@/components/ui/card"

interface Item {
 id: string
 name: string
}

export function VirtualList({ items }: { items: Item[] }) {
 const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
 <div style={style}>
 <Card className="p-2">
 <p>{items[index].name}</p>
 </Card>
 </div>
 )

 return (
 <FixedSizeList
 height={600}
 itemCount={items.length}
 itemSize={80}
 width="100%"
 >
 {Row}
 </FixedSizeList>
 )
}
```

### 페이지네이션 패턴

```typescript
import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function PaginatedList() {
 const [page, setPage] = React.useState(1)
 const itemsPerPage = 10

 const startIndex = (page - 1) * itemsPerPage
 const endIndex = startIndex + itemsPerPage

 return (
 <div>
 <div className="space-y-2">
 {/* 현재 페이지의 항목만 렌더링 */}
 </div>
 <div className="flex gap-2">
 <Button onClick={() => setPage(page - 1)} disabled={page === 1}>
 이전
 </Button>
 <span>{page} 페이지</span>
 <Button onClick={() => setPage(page + 1)}>
 다음
 </Button>
 </div>
 </div>
 )
}
```

## 네트워크 최적화

### Next.js를 활용한 이미지 최적화

```typescript
import Image from "next/image"

export function OptimizedImage() {
 return (
 <Image
 src="/image.jpg"
 alt="최적화된 이미지"
 width={400}
 height={300}
 priority={false}
 loading="lazy"
 />
 )
}
```

## 모범 사례 요약

1. 컴포넌트 지연 로드 - 비핵심 컴포넌트에 React.lazy 사용
2. 선택적 메모이제이션 - 과도한 메모이제이션을 피하고 먼저 프로파일링
3. 임포트 트리 셰이킹 - 전체 라이브러리가 아닌 특정 컴포넌트 임포트
4. CSS 최적화 - Tailwind content를 적절히 구성
5. 대규모 리스트 가상 스크롤링 - 1000개 이상의 항목에 react-window 사용
6. 계산 캐싱 - useMemo와 useCallback을 적절히 사용
7. 번들 모니터링 - 번들 분석기를 사용하여 병목 지점 식별

---

버전: 4.0.0
최종 업데이트: 2025-11-22
토큰 초점: CSS 파일 크기, JavaScript 번들 크기, 렌더링 성능
