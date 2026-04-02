# 프론트엔드 개발 예제

React 19, Next.js 16, Vue 3.5, 최신 컴포넌트 아키텍처를 다루는 멀티샷 프롬프팅 실용 패턴 예제.

---

## 예제 1: React 19 서버 컴포넌트와 데이터 페칭

**시나리오**: 서버 사이드 데이터 페칭과 클라이언트 상호작용이 있는 사용자 대시보드 구축.

**입력**:
```tsx
// 필요: 프로필과 최근 활동을 표시하는 사용자 대시보드
// 요구사항:
// - 성능을 위한 서버 사이드 데이터 페칭
// - 액션을 위한 클라이언트 사이드 상호작용
// - 적절한 로딩 및 에러 상태
```

**출력**:
```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { cache } from 'react'
import { getUserProfile, getUserActivity } from '@/lib/api/users'
import { DashboardSkeleton } from '@/components/skeletons'
import { UserProfile } from './UserProfile'
import { ActivityFeed } from './ActivityFeed'
import { DashboardActions } from './DashboardActions'

// 요청 중복 제거를 위한 캐시된 데이터 페칭
const getUser = cache(async (userId: string) => {
  return await getUserProfile(userId)
})

const getActivity = cache(async (userId: string) => {
  return await getUserActivity(userId, { limit: 10 })
})

interface DashboardPageProps {
  params: { userId: string }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { userId } = params

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">대시보드</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 서버 컴포넌트 - 프로필 */}
        <div className="lg:col-span-1">
          <Suspense fallback={<DashboardSkeleton type="profile" />}>
            <UserProfileSection userId={userId} />
          </Suspense>
        </div>

        {/* 서버 컴포넌트 - 스트리밍이 포함된 활동 */}
        <div className="lg:col-span-2">
          <Suspense fallback={<DashboardSkeleton type="activity" />}>
            <ActivitySection userId={userId} />
          </Suspense>
        </div>
      </div>

      {/* 클라이언트 컴포넌트 - 상호작용 액션 */}
      <DashboardActions userId={userId} />
    </div>
  )
}

async function UserProfileSection({ userId }: { userId: string }) {
  const user = await getUser(userId)

  return <UserProfile user={user} />
}

async function ActivitySection({ userId }: { userId: string }) {
  const activity = await getActivity(userId)

  return <ActivityFeed activities={activity} />
}

// components/dashboard/DashboardActions.tsx
'use client'

import { useState, useTransition } from 'react'
import { refreshDashboard } from '@/app/actions/dashboard'
import { Button } from '@/components/ui/button'

interface DashboardActionsProps {
  userId: string
}

export function DashboardActions({ userId }: DashboardActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshDashboard(userId)
      setMessage(result.message)
    })
  }

  return (
    <div className="mt-6 flex items-center gap-4">
      <Button
        onClick={handleRefresh}
        disabled={isPending}
      >
        {isPending ? '새로고침 중...' : '대시보드 새로고침'}
      </Button>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
```

**설명**: 이 패턴은 효율적인 데이터 페칭을 위한 React 19 서버 컴포넌트, cache()를 사용한 요청 중복 제거, 스트리밍을 위한 Suspense, 상호작용을 위한 클라이언트 컴포넌트를 보여줍니다.

---

## 예제 2: Next.js 16 Server Actions와 폼 처리

**시나리오**: 서버 사이드 유효성 검사가 포함된 사용자 등록 폼 구현.

**입력**:
```tsx
// 필요: 등록 폼:
// - 서버 사이드 유효성 검사
// - 실시간 피드백
// - 점진적 향상 (JS 없이도 동작)
```

**출력**:
```tsx
// app/register/page.tsx
import { RegisterForm } from './RegisterForm'

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">계정 생성</h1>
      <RegisterForm />
    </div>
  )
}

// app/register/RegisterForm.tsx
'use client'

import { useActionState } from 'react'
import { registerUser, type RegisterState } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const initialState: RegisterState = {
  success: false,
  errors: {}
}

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerUser,
    initialState
  )

  return (
    <form action={formAction} className="space-y-4">
      {state.errors?.general && (
        <Alert variant="destructive">
          <AlertDescription>{state.errors.general}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="홍길동"
          aria-describedby="name-error"
        />
        {state.errors?.name && (
          <p id="name-error" className="text-sm text-destructive">
            {state.errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="user@example.com"
          aria-describedby="email-error"
        />
        {state.errors?.email && (
          <p id="email-error" className="text-sm text-destructive">
            {state.errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={8}
          aria-describedby="password-error"
        />
        {state.errors?.password && (
          <p id="password-error" className="text-sm text-destructive">
            {state.errors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '계정 생성 중...' : '계정 생성'}
      </Button>
    </form>
  )
}

// app/actions/auth.ts
'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createUser } from '@/lib/users'

const registerSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다')
})

export interface RegisterState {
  success: boolean
  errors?: {
    name?: string
    email?: string
    password?: string
    general?: string
  }
}

export async function registerUser(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  // 파싱 및 유효성 검사
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password')
  }

  const validatedFields = registerSchema.safeParse(rawData)

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors
    return {
      success: false,
      errors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0]
      }
    }
  }

  try {
    await createUser(validatedFields.data)
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      return {
        success: false,
        errors: { email: '이미 등록된 이메일입니다' }
      }
    }
    return {
      success: false,
      errors: { general: '문제가 발생했습니다. 다시 시도해주세요.' }
    }
  }

  redirect('/login?registered=true')
}
```

**설명**: 이 패턴은 폼 처리를 위한 useActionState를 사용한 Next.js 16 Server Actions, Zod 유효성 검사, 적절한 에러 메시지, 점진적 향상을 보여줍니다.

---

## 예제 3: Vue 3.5 Composition API와 TypeScript

**시나리오**: 정렬과 페이지네이션이 있는 재사용 가능한 데이터 테이블 컴포넌트 생성.

**입력**:
```vue
<!-- 필요: 재사용 가능한 데이터 테이블:
- 타입 안전한 props와 emits
- 컬럼별 정렬
- 페이지네이션
- 로딩 및 빈 상태 -->
```

**출력**:
```vue
<!-- components/DataTable.vue -->
<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref } from 'vue'

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => string
}

interface Props {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pageSize: 10
})

const emit = defineEmits<{
  rowClick: [row: T]
  sort: [column: keyof T, direction: 'asc' | 'desc']
}>()

// 정렬 상태
const sortColumn = ref<keyof T | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// 페이지네이션 상태
const currentPage = ref(1)

// 계산됨: 정렬된 데이터
const sortedData = computed(() => {
  if (!sortColumn.value) return props.data

  return [...props.data].sort((a, b) => {
    const aVal = a[sortColumn.value!]
    const bVal = b[sortColumn.value!]

    if (aVal === bVal) return 0

    const comparison = aVal < bVal ? -1 : 1
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

// 계산됨: 페이지네이션된 데이터
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return sortedData.value.slice(start, start + props.pageSize)
})

// 계산됨: 총 페이지 수
const totalPages = computed(() => {
  return Math.ceil(props.data.length / props.pageSize)
})

// 메서드
function handleSort(column: Column<T>) {
  if (!column.sortable) return

  if (sortColumn.value === column.key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column.key
    sortDirection.value = 'asc'
  }

  emit('sort', column.key, sortDirection.value)
}

function handleRowClick(row: T) {
  emit('rowClick', row)
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function getCellValue(row: T, column: Column<T>): string {
  const value = row[column.key]
  if (column.render) {
    return column.render(value, row)
  }
  return String(value ?? '')
}
</script>

<template>
  <div class="data-table">
    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner" />
    </div>

    <!-- 테이블 -->
    <table class="w-full">
      <thead>
        <tr class="border-b">
          <th
            v-for="column in columns"
            :key="String(column.key)"
            class="px-4 py-3 text-left"
            :class="{ 'cursor-pointer hover:bg-muted': column.sortable }"
            @click="handleSort(column)"
          >
            <div class="flex items-center gap-2">
              {{ column.label }}
              <span v-if="column.sortable && sortColumn === column.key">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <!-- 빈 상태 -->
        <tr v-if="!loading && data.length === 0">
          <td :colspan="columns.length" class="px-4 py-8 text-center text-muted-foreground">
            데이터가 없습니다
          </td>
        </tr>

        <!-- 데이터 행 -->
        <tr
          v-for="(row, index) in paginatedData"
          :key="index"
          class="border-b hover:bg-muted/50 cursor-pointer"
          @click="handleRowClick(row)"
        >
          <td
            v-for="column in columns"
            :key="String(column.key)"
            class="px-4 py-3"
          >
            {{ getCellValue(row, column) }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 페이지네이션 -->
    <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t">
      <div class="text-sm text-muted-foreground">
        {{ data.length }}개 중 {{ (currentPage - 1) * pageSize + 1 }}에서
        {{ Math.min(currentPage * pageSize, data.length) }} 표시
      </div>

      <div class="flex gap-1">
        <button
          class="px-3 py-1 rounded hover:bg-muted disabled:opacity-50"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          이전
        </button>

        <button
          v-for="page in totalPages"
          :key="page"
          class="px-3 py-1 rounded"
          :class="page === currentPage ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>

        <button
          class="px-3 py-1 rounded hover:bg-muted disabled:opacity-50"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          다음
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table {
  @apply relative overflow-hidden rounded-lg border;
}

.loading-overlay {
  @apply absolute inset-0 bg-background/80 flex items-center justify-center z-10;
}

.spinner {
  @apply w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin;
}
</style>
```

**설명**: 이 Vue 3.5 패턴은 TypeScript와 제네릭 컴포넌트, 계산된 속성을 활용한 Composition API, 포괄적인 데이터 테이블 기능을 보여줍니다.

---

## 공통 패턴

### 패턴 1: 복합 컴포넌트

유연하고 조합 가능한 컴포넌트 API 구축:

```tsx
// components/Card/index.tsx
import { createContext, useContext, ReactNode } from 'react'

interface CardContextValue {
  variant: 'default' | 'outlined' | 'elevated'
}

const CardContext = createContext<CardContextValue>({ variant: 'default' })

interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated'
  children: ReactNode
  className?: string
}

export function Card({ variant = 'default', children, className }: CardProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div className={cn('rounded-lg', variantStyles[variant], className)}>
        {children}
      </div>
    </CardContext.Provider>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-b', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  const { variant } = useContext(CardContext)
  return (
    <div className={cn('px-6 py-4 border-t', className)}>
      {children}
    </div>
  )
}

// 사용법
<Card variant="elevated">
  <CardHeader>
    <CardTitle>카드 제목</CardTitle>
  </CardHeader>
  <CardContent>
    <p>카드 콘텐츠가 여기에 들어갑니다.</p>
  </CardContent>
  <CardFooter>
    <Button>액션</Button>
  </CardFooter>
</Card>
```

### 패턴 2: 데이터 페칭을 위한 커스텀 훅

```tsx
// hooks/useQuery.ts
import { useState, useEffect, useCallback } from 'react'

interface UseQueryOptions<T> {
  enabled?: boolean
  refetchInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseQueryResult<T> {
  data: T | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const { enabled = true, refetchInterval, onSuccess, onError } = options

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [queryFn, onSuccess, onError])

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, fetchData])

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval)
      return () => clearInterval(interval)
    }
  }, [refetchInterval, enabled, fetchData])

  return {
    data,
    isLoading,
    isError: error !== null,
    error,
    refetch: fetchData
  }
}

// 사용법
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useQuery(
    () => fetchUser(userId),
    {
      enabled: !!userId,
      onSuccess: (user) => console.log('User loaded:', user.name)
    }
  )

  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />

  return <div>{user?.name}</div>
}
```

### 패턴 3: 메모이제이션을 활용한 성능 최적화

```tsx
import { memo, useMemo, useCallback, useDeferredValue } from 'react'

interface SearchListProps {
  items: Item[]
  searchTerm: string
  onSelect: (item: Item) => void
}

export const SearchList = memo(function SearchList({
  items,
  searchTerm,
  onSelect
}: SearchListProps) {
  // 부드러운 타이핑을 위해 검색 지연
  const deferredSearchTerm = useDeferredValue(searchTerm)

  // 필터링된 결과 메모이제이션
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(deferredSearchTerm.toLowerCase())
    )
  }, [items, deferredSearchTerm])

  // 콜백 메모이제이션
  const handleSelect = useCallback((item: Item) => {
    onSelect(item)
  }, [onSelect])

  // 업데이트 중 지연 표시기
  const isStale = searchTerm !== deferredSearchTerm

  return (
    <div className={isStale ? 'opacity-70' : ''}>
      {filteredItems.map(item => (
        <SearchItem
          key={item.id}
          item={item}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
})

// 메모이제이션된 자식 컴포넌트
const SearchItem = memo(function SearchItem({
  item,
  onSelect
}: {
  item: Item
  onSelect: (item: Item) => void
}) {
  return (
    <div onClick={() => onSelect(item)}>
      {item.name}
    </div>
  )
})
```

---

## 안티패턴 (피해야 할 패턴)

### 안티패턴 1: Prop Drilling

**문제**: 많은 중간 컴포넌트를 통해 props를 전달.

```tsx
// 잘못된 접근
function App() {
  const [user, setUser] = useState<User | null>(null)
  return <Layout user={user} setUser={setUser} />
}

function Layout({ user, setUser }) {
  return <Sidebar user={user} setUser={setUser} />
}

function Sidebar({ user, setUser }) {
  return <UserMenu user={user} setUser={setUser} />
}
```

**해결책**: Context 또는 상태 관리 사용.

```tsx
// 올바른 접근
const UserContext = createContext<{
  user: User | null
  setUser: (user: User | null) => void
} | null>(null)

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}

function UserMenu() {
  const { user, setUser } = useUser()
  // prop drilling 없이 직접 접근
}
```

### 안티패턴 2: 인라인 함수 정의

**문제**: 매 렌더링마다 새로운 함수 참조 생성.

```tsx
// 잘못된 접근
function List({ items }) {
  return items.map(item => (
    // 매 렌더링마다 새 함수 생성
    <Item key={item.id} onClick={() => handleClick(item.id)} />
  ))
}
```

**해결책**: useCallback 또는 컴포넌트 레벨 핸들러 사용.

```tsx
// 올바른 접근
function List({ items }) {
  const handleClick = useCallback((id: string) => {
    // 클릭 처리
  }, [])

  return items.map(item => (
    <Item
      key={item.id}
      id={item.id}
      onClick={handleClick}
    />
  ))
}

// 또는 적절한 메모이제이션
const Item = memo(function Item({
  id,
  onClick
}: {
  id: string
  onClick: (id: string) => void
}) {
  return <div onClick={() => onClick(id)}>Item {id}</div>
})
```

### 안티패턴 3: useEffect에서 페칭

**문제**: 서버 사이드가 더 나은 경우 클라이언트 사이드 페칭.

```tsx
// Next.js에서 잘못된 접근
'use client'
function UserPage({ userId }: { userId: string }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
  }, [userId])

  return <div>{user?.name}</div>
}
```

**해결책**: 초기 데이터에 서버 컴포넌트 사용.

```tsx
// 올바른 접근
// app/users/[userId]/page.tsx
async function UserPage({ params }: { params: { userId: string } }) {
  const user = await getUser(params.userId)
  return <UserProfile user={user} />
}
```

---

## 접근성 패턴

### 포커스 관리

```tsx
function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      modalRef.current?.focus()
    } else {
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      {children}
    </div>
  )
}
```

---

*추가 패턴 및 프레임워크별 최적화에 대해서는 관련 스킬과 문서를 참조하세요.*
