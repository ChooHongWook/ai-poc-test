# Next.js 16 패턴

App Router, Server Actions, ISR(증분 정적 재생성), Route Handlers를 포괄하는 Next.js 16 개발 종합 패턴.

---

## App Router 아키텍처

### 파일 기반 라우팅

```
app/
├── layout.tsx          # 루트 레이아웃
├── page.tsx            # 홈 페이지 (/)
├── loading.tsx         # 로딩 UI
├── error.tsx           # 에러 UI
├── not-found.tsx       # 404 UI
├── dashboard/
│   ├── layout.tsx      # 대시보드 레이아웃
│   ├── page.tsx        # /dashboard
│   └── settings/
│       └── page.tsx    # /dashboard/settings
├── blog/
│   ├── page.tsx        # /blog
│   └── [slug]/
│       └── page.tsx    # /blog/:slug
└── api/
    └── users/
        └── route.ts    # API 라우트
```

### 레이아웃과 템플릿

```tsx
// app/layout.tsx - 루트 레이아웃
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'My App',
    template: '%s | My App'
  },
  description: '최신 웹 애플리케이션',
  metadataBase: new URL('https://myapp.com')
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

// app/dashboard/layout.tsx - 중첩 레이아웃
import { Sidebar } from '@/components/Sidebar'
import { requireAuth } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}
```

### 동적 라우트

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getPost, getAllPosts } from '@/lib/posts'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return { title: '게시물을 찾을 수 없습니다' }
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage]
    }
  }
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug
  }))
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="prose prose-lg mx-auto">
      <h1>{post.title}</h1>
      <time dateTime={post.publishedAt}>{post.formattedDate}</time>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}
```

---

## Server Actions

### Server Actions를 사용한 폼 처리

```tsx
// app/actions/posts.ts
'use server'

import { z } from 'zod'
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const createPostSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다').max(100),
  content: z.string().min(10, '내용은 최소 10자 이상이어야 합니다'),
  published: z.boolean().optional().default(false)
})

export interface ActionState {
  success: boolean
  errors?: {
    title?: string
    content?: string
    general?: string
  }
  data?: { id: string }
}

export async function createPost(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()

  if (!session?.user) {
    return {
      success: false,
      errors: { general: '로그인이 필요합니다' }
    }
  }

  const rawData = {
    title: formData.get('title'),
    content: formData.get('content'),
    published: formData.get('published') === 'on'
  }

  const result = createPostSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    return {
      success: false,
      errors: {
        title: fieldErrors.title?.[0],
        content: fieldErrors.content?.[0]
      }
    }
  }

  try {
    const post = await db.post.create({
      data: {
        ...result.data,
        authorId: session.user.id
      }
    })

    revalidatePath('/posts')
    revalidateTag('posts')

    return {
      success: true,
      data: { id: post.id }
    }
  } catch (error) {
    console.error('게시물 생성 실패:', error)
    return {
      success: false,
      errors: { general: '게시물 생성에 실패했습니다. 다시 시도해 주세요.' }
    }
  }
}

export async function deletePost(postId: string) {
  const session = await auth()

  if (!session?.user) {
    throw new Error('인증되지 않음')
  }

  const post = await db.post.findUnique({
    where: { id: postId }
  })

  if (!post || post.authorId !== session.user.id) {
    throw new Error('권한 없음')
  }

  await db.post.delete({ where: { id: postId } })

  revalidatePath('/posts')
  revalidateTag('posts')
  redirect('/posts')
}

export async function togglePublish(postId: string) {
  const post = await db.post.findUnique({
    where: { id: postId }
  })

  if (!post) {
    throw new Error('게시물을 찾을 수 없습니다')
  }

  await db.post.update({
    where: { id: postId },
    data: { published: !post.published }
  })

  revalidatePath(`/posts/${postId}`)
  revalidatePath('/posts')
}
```

### 컴포넌트에서 Server Actions 사용하기

```tsx
// app/posts/new/page.tsx
'use client'

import { useActionState } from 'react'
import { createPost, type ActionState } from '@/app/actions/posts'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const initialState: ActionState = {
  success: false,
  errors: {}
}

export default function NewPostPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    createPost,
    initialState
  )

  useEffect(() => {
    if (state.success && state.data?.id) {
      router.push(`/posts/${state.data.id}`)
    }
  }, [state, router])

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">새 게시물 작성</h1>

      <form action={formAction} className="space-y-6">
        {state.errors?.general && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            {state.errors.general}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block font-medium mb-2">
            제목
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="w-full border rounded px-3 py-2"
            aria-describedby={state.errors?.title ? 'title-error' : undefined}
          />
          {state.errors?.title && (
            <p id="title-error" className="text-red-600 text-sm mt-1">
              {state.errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="content" className="block font-medium mb-2">
            내용
          </label>
          <textarea
            id="content"
            name="content"
            rows={8}
            className="w-full border rounded px-3 py-2"
            aria-describedby={state.errors?.content ? 'content-error' : undefined}
          />
          {state.errors?.content && (
            <p id="content-error" className="text-red-600 text-sm mt-1">
              {state.errors.content}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input id="published" name="published" type="checkbox" />
          <label htmlFor="published">즉시 게시</label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isPending ? '생성 중...' : '게시물 작성'}
        </button>
      </form>
    </div>
  )
}
```

---

## 증분 정적 재생성 (ISR)

### 시간 기반 재검증

```tsx
// app/products/page.tsx
import { getProducts } from '@/lib/products'

// 60초마다 재검증
export const revalidate = 60

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="grid grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### 온디맨드 재검증

```tsx
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: '유효하지 않은 시크릿' }, { status: 401 })
  }

  const body = await request.json()
  const { path, tag, type } = body

  try {
    if (type === 'path' && path) {
      revalidatePath(path)
      return NextResponse.json({ revalidated: true, path })
    }

    if (type === 'tag' && tag) {
      revalidateTag(tag)
      return NextResponse.json({ revalidated: true, tag })
    }

    return NextResponse.json({ error: '유효하지 않은 요청' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: '재검증 실패' }, { status: 500 })
  }
}
```

### 태그 기반 캐싱

```tsx
// lib/products.ts
export async function getProducts() {
  const response = await fetch('https://api.example.com/products', {
    next: { tags: ['products'], revalidate: 3600 }
  })
  return response.json()
}

export async function getProduct(id: string) {
  const response = await fetch(`https://api.example.com/products/${id}`, {
    next: { tags: ['products', `product-${id}`] }
  })
  return response.json()
}

// 서버 액션 또는 API 라우트에서
export async function updateProduct(id: string, data: ProductData) {
  await db.product.update({ where: { id }, data })

  // 특정 제품과 제품 목록 재검증
  revalidateTag(`product-${id}`)
  revalidateTag('products')
}
```

---

## Route Handlers

### RESTful API 라우트

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

// GET /api/users
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    db.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.user.count()
  ])

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}

// POST /api/users
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { error: '인증되지 않음' },
      { status: 401 }
    )
  }

  const body = await request.json()
  const result = createUserSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: '유효성 검사 실패', details: result.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const user = await db.user.create({
      data: result.data
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다' },
        { status: 409 }
      )
    }
    throw error
  }
}

// app/api/users/[id]/route.ts
interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const user = await db.user.findUnique({ where: { id } })

  if (!user) {
    return NextResponse.json(
      { error: '사용자를 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const body = await request.json()

  const user = await db.user.update({
    where: { id },
    data: body
  })

  return NextResponse.json(user)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  await db.user.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
```

---

## 병렬 및 인터셉팅 라우트

### 병렬 라우트

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  notifications,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  notifications: React.ReactNode
}) {
  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">{children}</main>
      <aside className="dashboard-sidebar">
        <div className="analytics-panel">{analytics}</div>
        <div className="notifications-panel">{notifications}</div>
      </aside>
    </div>
  )
}

// app/dashboard/@analytics/page.tsx
export default async function AnalyticsPanel() {
  const data = await getAnalytics()
  return <AnalyticsChart data={data} />
}

// app/dashboard/@notifications/page.tsx
export default async function NotificationsPanel() {
  const notifications = await getNotifications()
  return <NotificationsList items={notifications} />
}
```

### 인터셉팅 라우트 (모달 패턴)

```tsx
// app/@modal/(.)photos/[id]/page.tsx
import { Modal } from '@/components/Modal'
import { getPhoto } from '@/lib/photos'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PhotoModal({ params }: PageProps) {
  const { id } = await params
  const photo = await getPhoto(id)

  return (
    <Modal>
      <img src={photo.url} alt={photo.title} className="max-w-full" />
      <h2>{photo.title}</h2>
      <p>{photo.description}</p>
    </Modal>
  )
}

// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        {modal}
      </body>
    </html>
  )
}
```

---

## 모범 사례

### 데이터 페칭 패턴

최상위 레벨에서 데이터 가져오기:
- 컴포넌트 트리 깊은 곳이 아닌 레이아웃이나 페이지에서 데이터를 가져옴
- Promise.all()을 사용한 병렬 데이터 페칭
- 요청 중복 제거 활용

캐싱 전략:
- 적절한 재검증 시간 사용
- 세분화된 캐시 무효화를 위한 데이터 태깅
- 변경되지 않는 콘텐츠에 대한 정적 생성 고려

### 에러 처리

```tsx
// app/dashboard/error.tsx
'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="error-container">
      <h2>문제가 발생했습니다!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>다시 시도</button>
    </div>
  )
}
```

---

버전: 2.0.0
최종 업데이트: 2026-01-06
