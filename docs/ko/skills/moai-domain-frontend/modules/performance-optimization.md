# 성능 최적화

코드 분할, 동적 임포트, 이미지 최적화, 메모이제이션 전략을 포함한 프론트엔드 성능 종합 패턴.

---

## 코드 분할

### 라우트 기반 분할 (Next.js)

```tsx
// Next.js App Router는 라우트별로 자동으로 코드를 분할합니다
// 각 page.tsx는 별도의 청크가 됩니다

// app/dashboard/page.tsx
// /dashboard로 네비게이션할 때 자동으로 지연 로딩됩니다
export default function DashboardPage() {
  return <Dashboard />
}

// 레이아웃의 경우, Suspense를 사용한 스트리밍
// app/dashboard/layout.tsx
import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/skeletons'

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Suspense fallback={<DashboardSkeleton />}>
        {children}
      </Suspense>
    </div>
  )
}
```

### 컴포넌트 레벨 분할

```tsx
// React 지연 로딩
import { lazy, Suspense } from 'react'

// 무거운 컴포넌트 지연 로딩
const HeavyChart = lazy(() => import('@/components/HeavyChart'))
const DataTable = lazy(() => import('@/components/DataTable'))

function Dashboard() {
  return (
    <div className="dashboard">
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart data={chartData} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <DataTable rows={tableData} />
      </Suspense>
    </div>
  )
}

// named exports와 lazy 사용
const { Modal } = await import('@/components/Modal')

// 더 빠른 네비게이션을 위한 프리로딩
const ChartComponent = lazy(() => import('@/components/Chart'))

function preloadChart() {
  import('@/components/Chart')
}

function Navigation() {
  return (
    <Link
      href="/analytics"
      onMouseEnter={preloadChart}
    >
      분석
    </Link>
  )
}
```

---

## 동적 임포트

### Next.js 동적 임포트

```tsx
import dynamic from 'next/dynamic'

// 기본 동적 임포트
const DynamicChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <ChartSkeleton />,
})

// 클라이언트 전용 컴포넌트를 위한 SSR 비활성화
const MapComponent = dynamic(
  () => import('@/components/Map'),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
)

// named exports
const Modal = dynamic(
  () => import('@/components/Modal').then((mod) => mod.Modal),
  {
    loading: () => <ModalSkeleton />,
  }
)

// 커스텀 로딩 컴포넌트와 함께
const Editor = dynamic(
  () => import('@/components/RichTextEditor'),
  {
    loading: () => (
      <div className="editor-skeleton animate-pulse">
        <div className="h-8 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-100 rounded mt-2" />
      </div>
    ),
    ssr: false,
  }
)

// 사용 예시
function EditorPage() {
  const [showEditor, setShowEditor] = useState(false)

  return (
    <div>
      <button onClick={() => setShowEditor(true)}>
        에디터 열기
      </button>

      {showEditor && <Editor />}
    </div>
  )
}
```

### 조건부 로딩 패턴

```tsx
function FeatureFlags({ features }) {
  return (
    <>
      {features.analytics && (
        <Suspense fallback={<AnalyticsSkeleton />}>
          <DynamicAnalytics />
        </Suspense>
      )}

      {features.chat && (
        <Suspense fallback={<ChatSkeleton />}>
          <DynamicChat />
        </Suspense>
      )}
    </>
  )
}

// 뷰포트 기반 로딩
function LazySection({ children }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      {isVisible ? children : <Skeleton />}
    </div>
  )
}
```

---

## 이미지 최적화

### Next.js Image 컴포넌트

```tsx
import Image from 'next/image'

// 기본 최적화 이미지
function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="히어로 이미지"
      width={1200}
      height={600}
      priority // LCP를 위해 즉시 로딩
    />
  )
}

// 반응형 이미지
function ProductImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover"
    />
  )
}

// 블러 플레이스홀더와 함께
function ArticleImage({ src, alt, blurDataURL }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={450}
      placeholder="blur"
      blurDataURL={blurDataURL}
    />
  )
}

// 로더를 사용한 원격 이미지
function CloudinaryImage({ publicId, alt }) {
  return (
    <Image
      loader={({ src, width, quality }) =>
        `https://res.cloudinary.com/demo/image/upload/w_${width},q_${quality || 75}/${src}`
      }
      src={publicId}
      alt={alt}
      width={500}
      height={300}
    />
  )
}
```

### 이미지 지연 로딩

```tsx
// 네이티브 지연 로딩
function GalleryImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  )
}

// Intersection Observer 패턴
function LazyImage({ src, alt, className }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
      {!isLoaded && <div className="skeleton" />}
    </div>
  )
}
```

---

## 메모이제이션 전략

### React 메모이제이션 훅

```tsx
import { memo, useMemo, useCallback, useDeferredValue } from 'react'

// 비용이 높은 계산 메모이제이션
function ExpensiveComponent({ items, filter }) {
  // items 또는 filter가 변경될 때만 재계산
  const filteredItems = useMemo(() => {
    console.log('필터링된 항목 계산 중...')
    return items
      .filter(item => item.name.includes(filter))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items, filter])

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}

// 자식 리렌더 방지를 위한 콜백 메모이제이션
function ParentComponent({ data }) {
  const [selected, setSelected] = useState<string | null>(null)

  // 안정적인 콜백 참조
  const handleSelect = useCallback((id: string) => {
    setSelected(id)
  }, [])

  // 안정적인 옵션 참조
  const sortOptions = useMemo(() => ({
    key: 'name',
    direction: 'asc'
  }), [])

  return (
    <ChildComponent
      items={data}
      onSelect={handleSelect}
      sortOptions={sortOptions}
    />
  )
}

// 자식 컴포넌트 메모이제이션
const ChildComponent = memo(function ChildComponent({
  items,
  onSelect,
  sortOptions
}: ChildProps) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  )
})

// 부드러운 입력을 위한 지연된 값
function SearchList({ items }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  // 계산 중에 이전 결과 표시
  const isStale = query !== deferredQuery

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(deferredQuery.toLowerCase())
    )
  }, [items, deferredQuery])

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="검색..."
      />

      <ul className={isStale ? 'opacity-50' : ''}>
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 커스텀 메모이제이션 훅

```tsx
// hooks/useMemoizedCallback.ts
import { useRef, useCallback } from 'react'

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const ref = useRef(callback)

  // 매 렌더마다 ref 업데이트
  ref.current = callback

  // 안정적인 함수 참조 반환
  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args)
  }, []) as T
}

// 사용법 - 의존성 지정 불필요
function Component({ onSubmit }) {
  const [value, setValue] = useState('')

  const handleSubmit = useMemoizedCallback(() => {
    onSubmit(value) // 항상 최신 value에 접근 가능
  })

  return <button onClick={handleSubmit}>제출</button>
}
```

---

## 번들 최적화

### Vite 설정

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2022',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // 벤더 청크
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
          ],
          'vendor-charts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },

  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
```

### 트리 쉐이킹 모범 사례

```typescript
// 트리 쉐이킹을 위해 named imports 선호
// 좋음 - 트리 쉐이킹 가능
import { Button, Input } from '@/components/ui'

// 피해야 함 - 전체 모듈 임포트
import * as UI from '@/components/ui'

// 트리 쉐이킹을 보존하는 배럴 exports
// components/ui/index.ts
export { Button } from './Button'
export { Input } from './Input'
export { Card } from './Card'

// 라이브러리 코드에서는 default exports 피하기
// 나쁨
export default Button

// 좋음
export { Button }
```

---

## 런타임 성능

### 긴 목록을 위한 가상화

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  })

  return (
    <div
      ref={parentRef}
      className="h-96 overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 디바운싱과 쓰로틀링

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// 사용 예시
function SearchInput({ onSearch }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery)
    }
  }, [debouncedQuery, onSearch])

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="검색..."
    />
  )
}
```

---

## 성능 모니터링

### Web Vitals 추적

```tsx
// lib/vitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals'

type Metric = {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
}

function sendToAnalytics(metric: Metric) {
  // 분석 서비스로 전송
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric),
  })
}

export function initVitals() {
  onCLS(sendToAnalytics)
  onFID(sendToAnalytics)
  onLCP(sendToAnalytics)
  onFCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}

// app/layout.tsx
import { initVitals } from '@/lib/vitals'

export default function RootLayout({ children }) {
  useEffect(() => {
    initVitals()
  }, [])

  return <html>{children}</html>
}
```

---

## 모범 사례 요약

코드 분할:
- 라우트별 자동 분할 (Next.js App Router)
- 무거운 컴포넌트 지연 로딩
- 더 빠른 네비게이션을 위한 호버 시 프리로딩

이미지:
- Next.js Image 컴포넌트 사용
- 블러 플레이스홀더 구현
- 적절한 sizes 속성 설정

메모이제이션:
- 비용이 높은 계산에 useMemo 사용
- 안정적인 콜백에 useCallback 사용
- 순수 컴포넌트에 memo 사용
- 부드러운 입력을 위해 useDeferredValue 사용

번들:
- 수동 청크 설정
- named imports 선호
- 번들 크기 모니터링

런타임:
- 긴 목록 가상화
- 비용이 높은 작업 디바운싱
- Web Vitals 추적

---

버전: 2.0.0
최종 업데이트: 2026-01-06
