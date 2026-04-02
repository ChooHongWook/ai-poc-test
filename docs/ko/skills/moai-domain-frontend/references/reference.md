# 프론트엔드 개발 레퍼런스

## API 레퍼런스

### React 19 훅

서버 컴포넌트 데이터 페칭:
```tsx
import { cache } from 'react'
import { use } from 'react'

// 캐시된 데이터 페칭 함수
const getUser = cache(async (id: string) => {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})

// 서버 컴포넌트
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId)
  return <div>{user.name}</div>
}

// use()를 사용한 클라이언트 컴포넌트
'use client'
function UserData({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise)
  return <div>{user.name}</div>
}
```

useOptimistic 훅:
```tsx
'use client'
import { useOptimistic, useTransition } from 'react'

function CommentList({ comments, addComment }: Props) {
  const [isPending, startTransition] = useTransition()
  const [optimisticComments, addOptimistic] = useOptimistic(
    comments,
    (state, newComment: Comment) => [...state, newComment]
  )

  async function handleSubmit(formData: FormData) {
    const newComment = { text: formData.get('text'), pending: true }
    addOptimistic(newComment)

    startTransition(async () => {
      await addComment(formData)
    })
  }

  return (
    <form action={handleSubmit}>
      <input name="text" />
      <button type="submit">추가</button>
      {optimisticComments.map(comment => (
        <Comment key={comment.id} {...comment} />
      ))}
    </form>
  )
}
```

useFormStatus 훅:
```tsx
'use client'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? '제출 중...' : '제출'}
    </button>
  )
}
```

### Next.js 16 API

Server Actions:
```tsx
// app/actions.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const post = await db.post.create({
    data: { title, content }
  })

  revalidatePath('/posts')
  revalidateTag('posts')
  redirect(`/posts/${post.id}`)
}

export async function updateUser(userId: string, data: UserUpdateData) {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')

  if (!token) {
    throw new Error('Unauthorized')
  }

  return await db.user.update({
    where: { id: userId },
    data
  })
}
```

병렬 라우트:
```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <div className="dashboard">
      <main>{children}</main>
      <aside className="sidebar">
        {analytics}
        {team}
      </aside>
    </div>
  )
}

// app/dashboard/@analytics/page.tsx
async function AnalyticsPanel() {
  const data = await getAnalytics()
  return <AnalyticsChart data={data} />
}

// app/dashboard/@team/page.tsx
async function TeamPanel() {
  const members = await getTeamMembers()
  return <TeamList members={members} />
}
```

인터셉팅 라우트:
```tsx
// app/feed/@modal/(.)photo/[id]/page.tsx
import { Modal } from '@/components/modal'
import { getPhoto } from '@/lib/photos'

export default async function PhotoModal({
  params: { id },
}: {
  params: { id: string }
}) {
  const photo = await getPhoto(id)
  return (
    <Modal>
      <img src={photo.url} alt={photo.title} />
    </Modal>
  )
}
```

### Vue 3.5 Composition API

Composable:
```typescript
// composables/useUser.ts
import { ref, computed, watch, onMounted } from 'vue'

export function useUser(userId: Ref<string>) {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName} ${user.value.lastName}`
  })

  async function fetchUser() {
    loading.value = true
    error.value = null
    try {
      user.value = await api.getUser(userId.value)
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  watch(userId, fetchUser, { immediate: true })

  return { user, loading, error, fullName, refetch: fetchUser }
}

// 컴포넌트에서 사용
const { user, loading, error } = useUser(toRef(props, 'userId'))
```

Provide/Inject 패턴:
```typescript
// context/theme.ts
import { provide, inject, ref, readonly } from 'vue'
import type { InjectionKey, Ref } from 'vue'

interface ThemeContext {
  theme: Ref<'light' | 'dark'>
  toggleTheme: () => void
}

const ThemeKey: InjectionKey<ThemeContext> = Symbol('theme')

export function provideTheme() {
  const theme = ref<'light' | 'dark'>('light')

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  provide(ThemeKey, {
    theme: readonly(theme),
    toggleTheme
  })

  return { theme, toggleTheme }
}

export function useTheme() {
  const context = inject(ThemeKey)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

---

## 설정 옵션

### Next.js 설정

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true,                    // 부분 사전 렌더링
    reactCompiler: true,          // React Compiler
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['my-domain.com']
    }
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        port: '',
        pathname: '/images/**'
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: true
  },

  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
      ]
    }
  ],

  redirects: async () => [
    {
      source: '/old-path',
      destination: '/new-path',
      permanent: true
    }
  ]
}

module.exports = nextConfig
```

### Vite 설정

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react'
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },

  build: {
    target: 'es2022',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### Tailwind CSS 설정

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ]
}
```

---

## 통합 패턴

### Zustand 상태 관리

```typescript
// stores/useStore.ts
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface AppState {
  user: User | null
  theme: 'light' | 'dark'
  notifications: Notification[]

  // 액션
  setUser: (user: User | null) => void
  toggleTheme: () => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          user: null,
          theme: 'light',
          notifications: [],

          setUser: (user) => set({ user }),

          toggleTheme: () =>
            set((state) => {
              state.theme = state.theme === 'light' ? 'dark' : 'light'
            }),

          addNotification: (notification) =>
            set((state) => {
              state.notifications.push(notification)
            }),

          removeNotification: (id) =>
            set((state) => {
              state.notifications = state.notifications.filter(n => n.id !== id)
            })
        }))
      ),
      {
        name: 'app-storage',
        partialize: (state) => ({ user: state.user, theme: state.theme })
      }
    )
  )
)

// 셀렉터
export const useUser = () => useStore((state) => state.user)
export const useTheme = () => useStore((state) => state.theme)
```

### React Query 통합

```typescript
// lib/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const
}

export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => api.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000,   // 30분
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => api.getUser(id),
    enabled: !!id
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
      api.updateUser(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) })
      const previous = queryClient.getQueryData(userKeys.detail(id))
      queryClient.setQueryData(userKeys.detail(id), (old: User) => ({
        ...old,
        ...data
      }))
      return { previous }
    },
    onError: (err, { id }, context) => {
      queryClient.setQueryData(userKeys.detail(id), context?.previous)
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    }
  })
}
```

---

## 트러블슈팅

### React 이슈

이슈: 하이드레이션 불일치 에러
증상: 하이드레이션 관련 콘솔 경고, 콘텐츠 깜빡임
해결책:
- 서버와 클라이언트가 동일한 콘텐츠를 렌더링하는지 확인
- 동적 콘텐츠에 suppressHydrationWarning 사용
- 브라우저 전용 코드를 useEffect로 래핑
- 클라이언트 전용 컴포넌트에 ssr: false와 동적 임포트 사용

이슈: 무한 리렌더링
증상: Maximum update depth exceeded 에러
해결책:
- 객체/배열 참조에 대한 useEffect 의존성 확인
- 참조 안정성을 위해 useMemo/useCallback 사용
- Effect에서 무조건적인 상태 설정 회피
- 이전 상태에 의존할 때 함수형 상태 업데이트 사용

이슈: 메모리 누수
증상: "Can't perform state update on unmounted component"
해결책:
- fetch 요청에 AbortController 사용
- useEffect 반환에서 구독 정리
- ref를 사용하여 컴포넌트 마운트 상태 추적
- 언마운트 시 비동기 작업 취소

### Next.js 이슈

이슈: "Module not found"로 빌드 실패
증상: 빌드 중 임포트 에러
해결책:
- 순환 의존성 확인
- 파일 확장자 및 대소문자 구분 확인
- 서버 전용 코드가 클라이언트 컴포넌트에서 임포트되지 않는지 확인
- 조건부 임포트에 next/dynamic 사용

이슈: 느린 페이지 로드
증상: 높은 TTFB, 큰 번들 크기
해결책:
- @next/bundle-analyzer로 번들 분석
- 대형 컴포넌트에 동적 임포트 사용
- 적절한 캐싱 전략 구현
- 부분 사전 렌더링을 위해 PPR 활성화

이슈: Server Action 에러
증상: "Error: Functions cannot be passed directly to Client Components"
해결책:
- 클라이언트 컴포넌트에 직렬화 가능한 props만 전달
- Server Actions에 추가 인수를 전달하려면 bind() 사용
- 복잡한 로직을 서버 사이드 유틸리티로 이동
- 적절한 에러 바운더리 사용

### 성능 이슈

이슈: 느린 초기 렌더링
증상: 높은 LCP, 레이아웃 시프트
해결책:
- 화면 상단 콘텐츠 우선순위 지정
- 히어로 이미지에 priority와 함께 next/image 사용
- 스켈레톤 로딩 상태 구현
- next/font로 폰트 로딩 최적화

이슈: 끊기는 애니메이션
증상: 프레임 드롭, 버벅임
해결책:
- 레이아웃 속성 대신 CSS transforms 사용
- 애니메이션 요소에 will-change 추가
- JS 애니메이션에 requestAnimationFrame 사용
- 레이어 프로모션으로 페인트 복잡성 감소

---

## 외부 리소스

### React
- React 문서: https://react.dev/
- React 19 변경 사항: https://react.dev/blog/2024/04/25/react-19
- React Compiler: https://react.dev/learn/react-compiler
- 서버 컴포넌트: https://react.dev/reference/rsc/server-components

### Next.js
- Next.js 문서: https://nextjs.org/docs
- App Router: https://nextjs.org/docs/app
- Server Actions: https://nextjs.org/docs/app/api-reference/functions/server-actions
- Vercel AI SDK: https://sdk.vercel.ai/docs

### Vue
- Vue 3 문서: https://vuejs.org/
- Vue Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- Pinia: https://pinia.vuejs.org/
- Nuxt 3: https://nuxt.com/docs

### 스타일링
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- Radix UI: https://www.radix-ui.com/primitives/docs
- CSS Modules: https://github.com/css-modules/css-modules

### 테스팅
- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/
- Playwright: https://playwright.dev/
- Cypress: https://www.cypress.io/

### 성능
- Web Vitals: https://web.dev/vitals/
- Lighthouse: https://developer.chrome.com/docs/lighthouse/
- Bundle Analyzer: https://www.npmjs.com/package/@next/bundle-analyzer

---

Version: 1.0.0
Last Updated: 2025-12-06
