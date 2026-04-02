# React 19 패턴

서버 컴포넌트, 동시성 기능, Suspense, cache() API를 포괄하는 React 19 개발 종합 패턴.

---

## 서버 컴포넌트 아키텍처

### 서버 컴포넌트 이해하기

서버 컴포넌트는 서버에서만 실행되어 데이터베이스에 직접 접근하고 민감한 로직을 서버 측에 유지할 수 있습니다. 클라이언트 번들 크기를 줄이고 초기 로딩 성능을 향상시킵니다.

주요 특징:
- 클라이언트 사이드 JavaScript 오버헤드 없음
- 백엔드 리소스에 직접 접근
- 자동 코드 분할
- 훅이나 브라우저 API 사용 불가

### 서버 컴포넌트 패턴

```tsx
// app/components/UserProfile.tsx
import { cache } from 'react'
import { getUser, getUserPosts } from '@/lib/api'

// 요청 중복 제거를 위한 데이터 페칭 캐시
const getUserCached = cache(async (userId: string) => {
  return await getUser(userId)
})

const getUserPostsCached = cache(async (userId: string) => {
  return await getUserPosts(userId, { limit: 10 })
})

interface UserProfileProps {
  userId: string
}

export default async function UserProfile({ userId }: UserProfileProps) {
  // 병렬 데이터 페칭
  const [user, posts] = await Promise.all([
    getUserCached(userId),
    getUserPostsCached(userId)
  ])

  return (
    <article className="user-profile">
      <header className="profile-header">
        <img src={user.avatar} alt={user.name} className="avatar" />
        <div className="info">
          <h1>{user.name}</h1>
          <p className="bio">{user.bio}</p>
          <p className="stats">
            팔로워 {user.followersCount}명 | 게시물 {posts.length}개
          </p>
        </div>
      </header>

      <section className="posts">
        <h2>최근 게시물</h2>
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>

      {/* 인터랙티비티를 위한 클라이언트 컴포넌트 */}
      <ProfileActions userId={userId} initialFollowing={user.isFollowing} />
    </article>
  )
}
```

### 클라이언트 컴포넌트 통합

```tsx
// components/ProfileActions.tsx
'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { followUser, unfollowUser } from '@/app/actions/users'
import { Button } from '@/components/ui/button'

interface ProfileActionsProps {
  userId: string
  initialFollowing: boolean
}

export function ProfileActions({ userId, initialFollowing }: ProfileActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic(
    initialFollowing,
    (current, newValue: boolean) => newValue
  )

  const handleToggleFollow = () => {
    const newValue = !optimisticFollowing
    setOptimisticFollowing(newValue)

    startTransition(async () => {
      if (newValue) {
        await followUser(userId)
      } else {
        await unfollowUser(userId)
      }
    })
  }

  return (
    <div className="profile-actions">
      <Button
        onClick={handleToggleFollow}
        variant={optimisticFollowing ? 'outline' : 'default'}
        disabled={isPending}
      >
        {optimisticFollowing ? '팔로잉' : '팔로우'}
      </Button>
    </div>
  )
}
```

---

## 동시성 기능

### 데이터 페칭을 위한 Suspense

```tsx
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

function DashboardPage() {
  return (
    <div className="dashboard">
      <h1>대시보드</h1>

      {/* 병렬 로딩을 위한 독립적인 Suspense 경계 */}
      <div className="grid grid-cols-3 gap-4">
        <ErrorBoundary fallback={<WidgetError />}>
          <Suspense fallback={<WidgetSkeleton />}>
            <AnalyticsWidget />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary fallback={<WidgetError />}>
          <Suspense fallback={<WidgetSkeleton />}>
            <RevenueWidget />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary fallback={<WidgetError />}>
          <Suspense fallback={<WidgetSkeleton />}>
            <UsersWidget />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}

// 각 위젯은 독립적으로 데이터를 가져옴
async function AnalyticsWidget() {
  const data = await getAnalytics()
  return (
    <div className="widget">
      <h3>분석</h3>
      <p>페이지 조회수: {data.pageViews}</p>
      <p>고유 방문자: {data.uniqueVisitors}</p>
    </div>
  )
}
```

### 비차단 업데이트를 위한 useTransition

```tsx
'use client'

import { useState, useTransition, useDeferredValue } from 'react'

interface SearchableListProps {
  items: Item[]
}

export function SearchableList({ items }: SearchableListProps) {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  // 부드러운 타이핑을 위해 필터링된 결과를 지연
  const deferredQuery = useDeferredValue(query)

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(deferredQuery.toLowerCase())
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // 입력에 대한 즉시 업데이트
    setQuery(value)

    // 비용이 높은 작업에는 startTransition 사용
    startTransition(() => {
      // 비용이 높은 필터링이나 상태 업데이트
    })
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={handleSearch}
        placeholder="검색..."
        className="search-input"
      />

      {/* 입력을 차단하지 않고 로딩 인디케이터 표시 */}
      <div className={isPending || query !== deferredQuery ? 'opacity-70' : ''}>
        {filteredItems.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
```

### 즉각적인 피드백을 위한 useOptimistic

```tsx
'use client'

import { useOptimistic, useTransition } from 'react'
import { addComment, deleteComment } from '@/app/actions/comments'

interface Comment {
  id: string
  text: string
  author: string
  pending?: boolean
}

interface CommentListProps {
  postId: string
  initialComments: Comment[]
}

export function CommentList({ postId, initialComments }: CommentListProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticComments, updateOptimistic] = useOptimistic(
    initialComments,
    (state, action: { type: 'add' | 'delete'; comment?: Comment; id?: string }) => {
      switch (action.type) {
        case 'add':
          return [...state, { ...action.comment!, pending: true }]
        case 'delete':
          return state.filter(c => c.id !== action.id)
        default:
          return state
      }
    }
  )

  const handleAddComment = async (formData: FormData) => {
    const text = formData.get('text') as string
    const tempId = `temp-${Date.now()}`

    const newComment: Comment = {
      id: tempId,
      text,
      author: '현재 사용자',
      pending: true
    }

    updateOptimistic({ type: 'add', comment: newComment })

    startTransition(async () => {
      await addComment(postId, text)
    })
  }

  const handleDelete = (commentId: string) => {
    updateOptimistic({ type: 'delete', id: commentId })

    startTransition(async () => {
      await deleteComment(commentId)
    })
  }

  return (
    <div className="comments">
      <form action={handleAddComment} className="comment-form">
        <textarea name="text" placeholder="댓글을 작성하세요..." required />
        <button type="submit" disabled={isPending}>
          {isPending ? '게시 중...' : '댓글 게시'}
        </button>
      </form>

      <ul className="comment-list">
        {optimisticComments.map(comment => (
          <li
            key={comment.id}
            className={comment.pending ? 'opacity-60' : ''}
          >
            <p>{comment.text}</p>
            <span className="author">{comment.author}</span>
            {!comment.pending && (
              <button onClick={() => handleDelete(comment.id)}>
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Cache API 패턴

### 요청 중복 제거

```tsx
import { cache } from 'react'

// 모듈 레벨에서 캐시된 함수 정의
const getUser = cache(async (id: string) => {
  console.log(`사용자 ${id} 가져오는 중`)
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})

const getTeam = cache(async (teamId: string) => {
  console.log(`팀 ${teamId} 가져오는 중`)
  const response = await fetch(`/api/teams/${teamId}`)
  return response.json()
})

// 여러 컴포넌트가 동일한 캐시된 함수를 호출할 수 있음
// 요청 라이프사이클당 하나의 요청만 수행됨

async function UserHeader({ userId }: { userId: string }) {
  const user = await getUser(userId)
  return <h1>{user.name}</h1>
}

async function UserStats({ userId }: { userId: string }) {
  const user = await getUser(userId) // 캐시된 결과 재사용
  return <p>가입일: {user.createdAt}</p>
}

async function UserPage({ userId }: { userId: string }) {
  return (
    <div>
      <UserHeader userId={userId} />
      <UserStats userId={userId} />
    </div>
  )
}
```

### 데이터 프리로딩

```tsx
import { cache } from 'react'

const getProducts = cache(async (category: string) => {
  const response = await fetch(`/api/products?category=${category}`)
  return response.json()
})

// 일찍 페칭을 시작하기 위한 프리로드 함수
function preloadProducts(category: string) {
  void getProducts(category)
}

// 부모 컴포넌트나 레이아웃에서
function CategoryNav({ categories }: { categories: string[] }) {
  return (
    <nav>
      {categories.map(category => (
        <Link
          key={category}
          href={`/products/${category}`}
          onMouseEnter={() => preloadProducts(category)}
        >
          {category}
        </Link>
      ))}
    </nav>
  )
}
```

---

## Actions를 사용한 폼 처리

### useActionState 패턴

```tsx
'use client'

import { useActionState } from 'react'
import { submitForm, type FormState } from '@/app/actions/form'

const initialState: FormState = {
  success: false,
  errors: {}
}

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitForm,
    initialState
  )

  return (
    <form action={formAction} className="space-y-4">
      {state.errors?.general && (
        <div className="alert alert-error">{state.errors.general}</div>
      )}

      {state.success && (
        <div className="alert alert-success">메시지가 성공적으로 전송되었습니다!</div>
      )}

      <div>
        <label htmlFor="name">이름</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          aria-describedby={state.errors?.name ? 'name-error' : undefined}
        />
        {state.errors?.name && (
          <p id="name-error" className="error">{state.errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          aria-describedby={state.errors?.email ? 'email-error' : undefined}
        />
        {state.errors?.email && (
          <p id="email-error" className="error">{state.errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="message">메시지</label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          aria-describedby={state.errors?.message ? 'message-error' : undefined}
        />
        {state.errors?.message && (
          <p id="message-error" className="error">{state.errors.message}</p>
        )}
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? '전송 중...' : '메시지 전송'}
      </button>
    </form>
  )
}
```

### 제출 버튼을 위한 useFormStatus

```tsx
'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending, data, method, action } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Spinner className="w-4 h-4" />
          제출 중...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

// 사용 예시
function MyForm() {
  return (
    <form action={submitAction}>
      <input name="email" type="email" />
      <SubmitButton>구독하기</SubmitButton>
    </form>
  )
}
```

---

## 모범 사례

### 컴포넌트 경계 가이드라인

서버 컴포넌트를 사용할 때:
- 데이터 페칭과 백엔드 접근
- 클라이언트로 전송하지 않아야 할 큰 의존성
- 보안에 민감한 작업
- 정적이거나 거의 변경되지 않는 콘텐츠

클라이언트 컴포넌트를 사용할 때:
- 이벤트 핸들러와 사용자 인터랙션
- 브라우저 API (localStorage, geolocation)
- 훅을 사용한 상태 관리
- 실시간 업데이트와 WebSocket 연결

### 성능 최적화

```tsx
// 중첩 Suspense를 사용한 스트리밍
function ProductPage({ productId }: { productId: string }) {
  return (
    <div className="product-page">
      {/* 핵심 콘텐츠가 먼저 로딩 */}
      <Suspense fallback={<ProductHeaderSkeleton />}>
        <ProductHeader productId={productId} />
      </Suspense>

      {/* 리뷰는 나중에 스트리밍 가능 */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews productId={productId} />
      </Suspense>

      {/* 추천은 가장 낮은 우선순위 */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <RelatedProducts productId={productId} />
      </Suspense>
    </div>
  )
}
```

---

## 주요 패턴 요약

서버 데이터 페칭:
- 요청 중복 제거에 cache() 사용
- Promise.all()로 병렬 페칭
- 더 빠른 네비게이션을 위해 호버 시 데이터 프리로딩

클라이언트 인터랙티비티:
- 비차단 업데이트에 useTransition
- 즉각적인 피드백에 useOptimistic
- 비용이 높은 계산에 useDeferredValue

폼 처리:
- 폼 상태 관리에 useActionState
- 제출 버튼 상태에 useFormStatus
- 폼 처리에 Server Actions

에러 경계:
- Suspense를 ErrorBoundary로 감싸기
- 의미 있는 폴백 UI 제공
- 모니터링을 위한 에러 로깅

---

버전: 2.0.0
최종 업데이트: 2026-01-06
