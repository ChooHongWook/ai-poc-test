# Vercel React 모범 사례

Vercel 엔지니어링에서 제공하는 React 및 Next.js 애플리케이션 성능 최적화 종합 가이드. 8개 카테고리에 걸쳐 45개 규칙을 영향도별로 우선순위를 매겨 자동화된 리팩토링 및 코드 생성을 안내합니다.

---

## 우선순위별 규칙 카테고리

| 우선순위 | 카테고리 | 영향도 | 접두사 |
|----------|----------|--------|--------|
| 1 | 워터폴 제거 | 치명적 | `async-` |
| 2 | 번들 크기 최적화 | 치명적 | `bundle-` |
| 3 | 서버 사이드 성능 | 높음 | `server-` |
| 4 | 클라이언트 사이드 데이터 페칭 | 중상 | `client-` |
| 5 | 리렌더링 최적화 | 중간 | `rerender-` |
| 6 | 렌더링 성능 | 중간 | `rendering-` |
| 7 | JavaScript 성능 | 중하 | `js-` |
| 8 | 고급 패턴 | 낮음 | `advanced-` |

---

## 1. 워터폴 제거 (치명적)

워터폴은 성능 저하의 가장 큰 원인입니다. 순차적 await마다 전체 네트워크 지연 시간이 추가됩니다. 이를 제거하면 가장 큰 성능 향상을 얻을 수 있습니다.

### 1.1 필요할 때까지 Await 지연

`await` 작업을 실제로 사용되는 분기로 이동하여 필요 없는 코드 경로를 차단하지 않도록 합니다.

```tsx
// 잘못된 예: 두 분기 모두 차단됨
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)

  if (skipProcessing) {
    return { skipped: true }
  }

  return processUserData(userData)
}

// 올바른 예: 필요할 때만 차단
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    return { skipped: true }
  }

  const userData = await fetchUserData(userId)
  return processUserData(userData)
}
```

### 1.2 독립 작업에 Promise.all() 사용

비동기 작업 간 의존성이 없으면 `Promise.all()`을 사용하여 동시에 실행합니다.

```tsx
// 잘못된 예: 순차 실행, 3번의 왕복
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()

// 올바른 예: 병렬 실행, 1번의 왕복
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
])
```

### 1.3 의존성 기반 병렬화

부분 의존성이 있는 작업에는 `better-all`을 사용하여 병렬성을 극대화합니다.

```tsx
// 잘못된 예: profile이 불필요하게 config를 기다림
const [user, config] = await Promise.all([
  fetchUser(),
  fetchConfig()
])
const profile = await fetchProfile(user.id)

// 올바른 예: config와 profile이 병렬 실행
import { all } from 'better-all'

const { user, config, profile } = await all({
  async user() { return fetchUser() },
  async config() { return fetchConfig() },
  async profile() {
    return fetchProfile((await this.$.user).id)
  }
})
```

### 1.4 API 라우트에서 워터폴 체인 방지

API 라우트와 Server Action에서 독립 작업은 await하지 않더라도 즉시 시작합니다.

```tsx
// 잘못된 예: config가 auth를 기다리고, data가 둘 다 기다림
export async function GET(request: Request) {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ data, config })
}

// 올바른 예: auth와 config가 즉시 시작
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id)
  ])
  return Response.json({ data, config })
}
```

### 1.5 전략적 Suspense 바운더리

비동기 컴포넌트에서 데이터를 await한 후 JSX를 반환하는 대신, Suspense 바운더리를 사용하여 데이터 로딩 중 래퍼 UI를 먼저 표시합니다.

```tsx
// 잘못된 예: 래퍼가 데이터 페칭에 의해 차단됨
async function Page() {
  const data = await fetchData()

  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div><DataDisplay data={data} /></div>
      <div>Footer</div>
    </div>
  )
}

// 올바른 예: 래퍼가 즉시 표시되고, 데이터가 스트리밍됨
function Page() {
  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <Suspense fallback={<Skeleton />}>
          <DataDisplay />
        </Suspense>
      </div>
      <div>Footer</div>
    </div>
  )
}

async function DataDisplay() {
  const data = await fetchData()
  return <div>{data.content}</div>
}
```

---

## 2. 번들 크기 최적화 (치명적)

초기 번들 크기를 줄이면 Time to Interactive와 Largest Contentful Paint가 개선됩니다.

### 2.1 배럴 파일 임포트 지양

배럴 파일 대신 소스 파일에서 직접 임포트하여 수천 개의 미사용 모듈 로딩을 방지합니다.

```tsx
// 잘못된 예: 전체 라이브러리 임포트
import { Check, X, Menu } from 'lucide-react'
// 1,583개 모듈 로드, 개발 환경에서 ~2.8초 추가

// 올바른 예: 필요한 것만 임포트
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
import Menu from 'lucide-react/dist/esm/icons/menu'
// 3개 모듈만 로드

// 대안: Next.js 13.5+
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@mui/material']
  }
}
```

### 2.2 무거운 컴포넌트의 동적 임포트

초기 렌더링에 필요하지 않은 대형 컴포넌트는 `next/dynamic`으로 지연 로드합니다.

```tsx
// 잘못된 예: Monaco가 메인 청크에 번들됨 ~300KB
import { MonacoEditor } from './monaco-editor'

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}

// 올바른 예: Monaco가 필요시 로드됨
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('./monaco-editor'),
  {
    loading: () => <EditorSkeleton />,
    ssr: false
  }
)

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

### 2.3 비핵심 서드파티 라이브러리 지연 로드

Analytics, 로깅, 에러 추적은 사용자 상호작용을 차단하지 않습니다. 하이드레이션 후에 로드합니다.

```tsx
// 잘못된 예: 초기 번들 차단
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

// 올바른 예: 하이드레이션 후 로드
import dynamic from 'next/dynamic'

const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(m => m.Analytics),
  { ssr: false }
)

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2.4 조건부 모듈 로딩

기능이 활성화될 때만 대용량 데이터나 모듈을 로드합니다.

```tsx
function AnimationPlayer({ enabled }: { enabled: boolean }) {
  const [frames, setFrames] = useState<Frame[] | null>(null)

  useEffect(() => {
    if (enabled && !frames && typeof window !== 'undefined') {
      import('./animation-frames.js')
        .then(mod => setFrames(mod.frames))
        .catch(() => setEnabled(false))
    }
  }, [enabled, frames])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```

### 2.5 사용자 의도 기반 프리로드

hover나 focus 시 컴포넌트를 프리로드하여 체감 속도를 향상시킵니다.

```tsx
import dynamic from 'next/dynamic'

const ChartComponent = dynamic(() => import('./Chart'))

function preloadChart() {
  import('./Chart')
}

function Navigation() {
  return (
    <Link
      href="/analytics"
      onMouseEnter={preloadChart}
      onFocus={preloadChart}
    >
      Analytics
    </Link>
  )
}
```

---

## 3. 서버 사이드 성능 (높음)

### 3.1 React.cache()를 사용한 요청별 중복 제거

비용이 큰 작업의 요청별 중복 제거에 `React.cache()`를 사용합니다.

```tsx
import { cache } from 'react'

const getData = cache(async (id: string) => {
  const response = await fetch(`https://api.example.com/data/${id}`)
  return response.json()
})

// 같은 요청 내 여러 호출이 중복 제거됨
async function UserPage({ params }: { params: { id: string } }) {
  const user = await getData(params.id)
  const posts = await getData(params.id) // 캐시된 결과 사용
  return <div>{/* ... */}</div>
}
```

### 3.2 크로스 요청 LRU 캐싱

적절한 경우 크로스 요청 캐싱에 LRU 캐시를 사용합니다.

```tsx
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, Data>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5분
})

async function getCachedData(key: string): Promise<Data> {
  if (cache.has(key)) {
    return cache.get(key)!
  }

  const data = await fetchData(key)
  cache.set(key, data)
  return data
}
```

### 3.3 RSC 경계에서 직렬화 최소화

클라이언트 컴포넌트에 전달하는 데이터를 최소화하여 직렬화 오버헤드를 줄입니다.

```tsx
// 잘못된 예: 전체 객체를 클라이언트에 전달
async function ServerComponent() {
  const user = await fetchUser()
  return <ClientComponent user={user} />
}

// 올바른 예: 필요한 필드만 전달
async function ServerComponent() {
  const user = await fetchUser()
  const minimalUser = {
    id: user.id,
    name: user.name,
    avatar: user.avatar
  }
  return <ClientComponent user={minimalUser} />
}
```

### 3.4 컴포넌트 구성을 통한 병렬 데이터 페칭

순차 체인 대신 페칭을 병렬화하도록 컴포넌트를 재구성합니다.

```tsx
// 잘못된 예: 순차 페칭
async function Page() {
  const user = await fetchUser()
  const posts = await fetchPosts(user.id)
  const comments = await fetchComments(posts.map(p => p.id))
  return <Dashboard user={user} posts={posts} comments={comments} />
}

// 올바른 예: 가능한 경우 병렬 페칭
async function Page() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(), // posts가 user에 엄격히 의존하지 않는 경우
    fetchComments() // comments가 posts에 엄격히 의존하지 않는 경우
  ])
  return <Dashboard user={user} posts={posts} comments={comments} />
}
```

### 3.5 논블로킹 작업에 after() 사용

응답 스트리밍 시작 후 실행할 수 있는 논블로킹 작업에 `after()`를 사용합니다.

```tsx
import { after } from 'next/server'

async function handler(request: Request) {
  const data = await fetchData()

  // 응답 전송 후 실행
  after(() => {
    logAnalytics(data)
  })

  return Response.json(data)
}
```

---

## 4. 클라이언트 사이드 데이터 페칭 (중상)

### 4.1 전역 이벤트 리스너 중복 제거

메모리 누수와 성능 문제를 방지하기 위해 전역 이벤트 리스너를 중복 제거합니다.

```tsx
// 잘못된 예: 렌더링마다 새 리스너 추가
function ChatComponent() {
  useEffect(() => {
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  })
  return <div>Chat</div>
}

// 올바른 예: 디스패처를 가진 단일 리스너
const onlineListeners = new Set<() => void>()

function addOnlineListener(fn: () => void) {
  onlineListeners.add(fn)
}

function removeOnlineListener(fn: () => void) {
  onlineListeners.delete(fn)
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    onlineListeners.forEach(fn => fn())
  })
}

function ChatComponent() {
  useEffect(() => {
    const handler = () => console.log('online')
    addOnlineListener(handler)
    return () => removeOnlineListener(handler)
  })
  return <div>Chat</div>
}
```

### 4.2 자동 중복 제거를 위한 SWR 사용

자동 요청 중복 제거와 캐싱을 위해 SWR을 사용합니다.

```tsx
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// 같은 키를 가진 여러 컴포넌트가 요청을 공유
function UserSection() {
  const { data: user } = useSWR('/api/user', fetcher)
  return <div>{user?.name}</div>
}

function UserPosts() {
  const { data: user } = useSWR('/api/user', fetcher) // 중복 제거됨
  return <div>{user?.posts?.length} posts</div>
}
```

---

## 5. 리렌더링 최적화 (중간)

### 5.1 상태 읽기를 사용 시점으로 지연

콜백에서만 사용되는 상태를 구독하지 않습니다.

```tsx
// 잘못된 예: count 변경 시 리렌더링
function Counter() {
  const [count, setCount] = useState(0)
  const handleClick = () => {
    console.log(count)
  }
  return <button onClick={handleClick}>Count: {count}</button>
}

// 올바른 예: 렌더링과 콜백에서만 count 읽기
function Counter() {
  const [count, setCount] = useState(0)
  const handleClick = () => {
    setCount(c => {
      console.log(c)
      return c
    })
  }
  return <button onClick={handleClick}>Count: {count}</button>
}
```

### 5.2 메모이제이션된 컴포넌트로 추출

비용이 큰 작업을 메모이제이션된 컴포넌트로 추출하여 조기 반환을 가능하게 합니다.

```tsx
// 잘못된 예: 로딩 중에도 아바타 계산
function Profile({ user, loading }: Props) {
  const avatar = useMemo(() => {
    const id = computeAvatarId(user)
    return <Avatar id={id} />
  }, [user])

  if (loading) return <Skeleton />
  return <div>{avatar}</div>
}

// 올바른 예: 로딩 중 계산 건너뛰기
const UserAvatar = memo(function UserAvatar({ user }: { user: User }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} />
})

function Profile({ user, loading }: Props) {
  if (loading) return <Skeleton />
  return <div><UserAvatar user={user} /></div>
}
```

### 5.3 Effect 의존성 좁히기

불필요한 재실행을 피하기 위해 Effect에서 원시값 의존성을 사용합니다.

```tsx
// 잘못된 예: user의 모든 변경에 실행됨
function UserProfile({ user }: { user: User }) {
  useEffect(() => {
    trackEvent('profile_view', { userId: user.id })
  }, [user]) // user의 모든 속성 변경에 실행

  return <div>{user.name}</div>
}

// 올바른 예: userId 변경 시에만 실행
function UserProfile({ user }: { user: User }) {
  useEffect(() => {
    trackEvent('profile_view', { userId: user.id })
  }, [user.id]) // id 변경 시에만 실행

  return <div>{user.name}</div>
}
```

### 5.4 파생 상태 구독

원시 값이 아닌 파생 불리언을 구독합니다.

```tsx
// 잘못된 예: user의 모든 변경에 리렌더링
function UserMenu({ user }: { user: User | null }) {
  if (!user) return <LoginButton />

  return (
    <Menu>
      <MenuItem>Welcome, {user.name}</MenuItem>
    </Menu>
  )
}

// 올바른 예: 인증 상태 변경 시에만 리렌더링
function UserMenu({ user }: { user: User | null }) {
  const isLoggedIn = user !== null

  if (!isLoggedIn) return <LoginButton />

  return (
    <Menu>
      <MenuItem>Welcome, {user.name}</MenuItem>
    </Menu>
  )
}
```

### 5.5 함수형 setState 업데이트 사용

안정적인 콜백을 위해 함수형 setState를 사용합니다.

```tsx
// 잘못된 예: 콜백이 이전 상태를 캡처
function Counter() {
  const [count, setCount] = useState(0)
  const increment = () => setCount(count + 1)
  return <button onClick={increment}>{count}</button>
}

// 올바른 예: 콜백이 항상 최신 상태를 가져옴
function Counter() {
  const [count, setCount] = useState(0)
  const increment = () => setCount(c => c + 1)
  return <button onClick={increment}>{count}</button>
}
```

### 5.6 지연 상태 초기화 사용

비용이 큰 값에 함수를 useState에 전달합니다.

```tsx
// 잘못된 예: 매 렌더링마다 실행됨
function List({ items }: { items: Item[] }) {
  const [sorted, setSorted] = useState(
    items.sort((a, b) => a.name.localeCompare(b.name))
  )
  return <ul>{sorted.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}

// 올바른 예: 초기화 시에만 실행됨
function List({ items }: { items: Item[] }) {
  const [sorted, setSorted] = useState(() =>
    items.sort((a, b) => a.name.localeCompare(b.name))
  )
  return <ul>{sorted.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}
```

### 5.7 긴급하지 않은 업데이트에 Transition 사용

긴급하지 않은 업데이트에 `startTransition`을 사용합니다.

```tsx
import { startTransition, useState } from 'react'

function SearchInput() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results[]>([])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // 긴급: 입력 즉시 업데이트
    setQuery(value)

    // 비긴급: 비용이 큰 필터링 지연
    startTransition(() => {
      setResults(filterResults(value))
    })
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      <ResultList items={results} />
    </div>
  )
}
```

---

## 6. 렌더링 성능 (중간)

### 6.1 SVG 요소 대신 래퍼 애니메이션

더 나은 성능을 위해 SVG 요소가 아닌 div 래퍼에 애니메이션을 적용합니다.

```tsx
// 잘못된 예: SVG 요소에 애니메이션
function AnimatedIcon() {
  return (
    <svg className="animate-spin">
      <path d="..." />
    </svg>
  )
}

// 올바른 예: 래퍼 div에 애니메이션
function AnimatedIcon() {
  return (
    <div className="animate-spin">
      <svg>
        <path d="..." />
      </svg>
    </div>
  )
}
```

### 6.2 긴 리스트에 CSS content-visibility 사용

렌더링 성능 향상을 위해 긴 리스트에 `content-visibility`를 사용합니다.

```tsx
function LongList({ items }: { items: Item[] }) {
  return (
    <div>
      {items.map(item => (
        <div
          key={item.id}
          style={{
            contentVisibility: 'auto',
            containIntrinsicSize: '0 100px'
          }}
        >
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  )
}
```

### 6.3 정적 JSX 요소 호이스팅

매 렌더링마다 재생성되지 않도록 정적 JSX를 컴포넌트 외부로 추출합니다.

```tsx
// 잘못된 예: 매 렌더링마다 새 객체 생성
function Component() {
  return (
    <div>
      <header className="fixed top-0 left-0 right-0 z-50">
        <Logo />
        <Navigation />
      </header>
      <main>{/* content */}</main>
    </div>
  )
}

// 올바른 예: 정적 JSX를 외부로 호이스팅
const header = (
  <header className="fixed top-0 left-0 right-0 z-50">
    <Logo />
    <Navigation />
  </header>
)

function Component() {
  return (
    <div>
      {header}
      <main>{/* content */}</main>
    </div>
  )
}
```

### 6.4 SVG 정밀도 최적화

파일 크기를 줄이기 위해 SVG 좌표 정밀도를 낮춥니다.

```tsx
// 최적화 전
<path d="M123.456 789.012 L345.678 901.234" />

// 최적화 후
<path d="M123.5 789 L346 901.2" />
```

### 6.5 깜빡임 없는 하이드레이션 불일치 방지

클라이언트 전용 데이터에 인라인 스크립트를 사용하여 하이드레이션 불일치를 방지합니다.

```tsx
export default function RootLayout() {
  return (
    <html>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.theme = localStorage.getItem('theme') || 'light'
              document.documentElement.classList.add(window.theme)
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 6.6 표시/숨기기에 Activity 컴포넌트 사용

상태를 보존하면서 표시/숨기기에 Activity 컴포넌트를 사용합니다.

```tsx
import { Activity } from 'react-activity'

function TabPanel({ activeTab }: { activeTab: string }) {
  return (
    <Activity mode={activeTab}>
      <Activity.Mode mode="profile">
        <ProfileTab />
      </Activity.Mode>
      <Activity.Mode mode="settings">
        <SettingsTab />
      </Activity.Mode>
    </Activity>
  )
}
```

### 6.7 명시적 조건부 렌더링 사용

0이 렌더링되는 것을 방지하기 위해 `&&` 대신 삼항 연산자를 사용합니다.

```tsx
// 잘못된 예: count가 0이면 0이 렌더링됨
function ItemCount({ count }: { count: number }) {
  return <div>{count && <span>{count} items</span>}</div>
}

// 올바른 예: 삼항 연산자로 명시적 렌더링
function ItemCount({ count }: { count: number }) {
  return <div>{count > 0 ? <span>{count} items</span> : null}</div>
}
```

---

## 7. JavaScript 성능 (중하)

### 7.1 DOM CSS 변경 일괄 처리

클래스나 cssText를 통해 CSS 변경을 그룹화합니다.

```tsx
// 잘못된 예: 여러 번의 리플로우
element.style.paddingTop = '10px'
element.style.paddingRight = '10px'
element.style.paddingBottom = '10px'
element.style.paddingLeft = '10px'

// 올바른 예: 단일 리플로우
element.style.cssText = 'padding: 10px'
// 또는
element.className = 'padded'
```

### 7.2 반복 조회를 위한 인덱스 Map 구축

반복 조회를 위해 Map을 구축합니다.

```tsx
// 잘못된 예: O(n) 조회 반복
const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
function getUserName(id: number) {
  return users.find(u => u.id === id)?.name
}

// 올바른 예: Map으로 O(1) 조회
const userMap = new Map(users.map(u => [u.id, u]))
function getUserName(id: number) {
  return userMap.get(id)?.name
}
```

### 7.3 루프에서 속성 접근 캐싱

루프에서 객체 속성을 캐싱합니다.

```tsx
// 잘못된 예: 매 반복마다 속성 접근
for (let i = 0; i < items.length; i++) {
  processItem(items[i], options.enabled, options.verbose)
}

// 올바른 예: 속성 접근 캐싱
const { enabled, verbose } = options
for (let i = 0; i < items.length; i++) {
  processItem(items[i], enabled, verbose)
}
```

### 7.4 반복 함수 호출 캐싱

모듈 레벨 Map에 함수 결과를 캐싱합니다.

```tsx
const expensiveCache = new Map<string, Result>()

function expensiveComputation(input: string): Result {
  if (expensiveCache.has(input)) {
    return expensiveCache.get(input)!
  }

  const result = compute(input)
  expensiveCache.set(input, result)
  return result
}
```

### 7.5 Storage API 호출 캐싱

localStorage/sessionStorage 읽기를 캐싱합니다.

```tsx
// 잘못된 예: 매 호출마다 스토리지에서 읽기
function getTheme(): string {
  return localStorage.getItem('theme') || 'light'
}

// 올바른 예: 무효화를 포함한 캐싱
let cachedTheme: string | null = null

function getTheme(): string {
  if (cachedTheme === null) {
    cachedTheme = localStorage.getItem('theme') || 'light'
  }
  return cachedTheme
}

function setTheme(theme: string): void {
  localStorage.setItem('theme', theme)
  cachedTheme = theme
}
```

### 7.6 여러 배열 반복 결합

여러 filter/map을 하나의 루프로 결합합니다.

```tsx
// 잘못된 예: 여러 번의 반복
const active = items.filter(item => item.active)
const sorted = active.sort((a, b) => a.name.localeCompare(b.name))
const transformed = sorted.map(item => ({ id: item.id, label: item.name }))

// 올바른 예: 단일 반복
const result = items
  .filter(item => item.active)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(item => ({ id: item.id, label: item.name }))
```

### 7.7 배열 비교 전 길이 확인

비용이 큰 비교 전에 배열 길이를 확인합니다.

```tsx
// 잘못된 예: 길이가 달라도 비교
function arraysEqual(a: unknown[], b: unknown[]): boolean {
  return a.every((item, i) => item === b[i])
}

// 올바른 예: 길이 불일치 시 조기 종료
function arraysEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false
  return a.every((item, i) => item === b[i])
}
```

### 7.8 함수에서 조기 반환

함수에서 조기 반환합니다.

```tsx
// 잘못된 예: 중첩된 조건
function process(input: string | null) {
  if (input !== null) {
    if (input.length > 0) {
      // 입력 처리
    } else {
      return { error: 'empty' }
    }
  } else {
    return { error: 'null' }
  }
}

// 올바른 예: 조기 반환
function process(input: string | null) {
  if (input === null) return { error: 'null' }
  if (input.length === 0) return { error: 'empty' }
  // 입력 처리
}
```

### 7.9 RegExp 생성 호이스팅

루프 외부에서 RegExp를 생성합니다.

```tsx
// 잘못된 예: 매 반복마다 RegExp 생성
for (const str of strings) {
  const match = str.match(/\d{3}-\d{3}-\d{4}/)
  // ...
}

// 올바른 예: RegExp를 한 번만 생성
const phoneRegex = /\d{3}-\d{3}-\d{4}/
for (const str of strings) {
  const match = str.match(phoneRegex)
  // ...
}
```

### 7.10 Min/Max에 정렬 대신 루프 사용

min/max에 sort 대신 루프를 사용합니다.

```tsx
// 잘못된 예: 단순 max에 O(n log n)
function max(arr: number[]): number {
  return arr.sort((a, b) => b - a)[0]
}

// 올바른 예: 단순 max에 O(n)
function max(arr: number[]): number {
  let max = arr[0]
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i]
  }
  return max
}
```

### 7.11 O(1) 조회에 Set/Map 사용

O(1) 조회에 Set/Map을 사용합니다.

```tsx
// 잘못된 예: O(n) array.includes
const allowed = ['admin', 'user', 'guest']
function hasPermission(role: string): boolean {
  return allowed.includes(role)
}

// 올바른 예: O(1) Set.has
const allowedSet = new Set(['admin', 'user', 'guest'])
function hasPermission(role: string): boolean {
  return allowedSet.has(role)
}
```

### 7.12 불변성을 위해 sort() 대신 toSorted() 사용

불변성을 위해 `toSorted()`를 사용합니다.

```tsx
// 잘못된 예: 원본 배열 변경
const sorted = items.sort((a, b) => a.name.localeCompare(b.name))

// 올바른 예: 새로운 정렬된 배열 반환
const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name))
```

---

## 8. 고급 패턴 (낮음)

### 8.1 이벤트 핸들러를 Ref에 저장

오래된 클로저를 방지하기 위해 이벤트 핸들러를 ref에 저장합니다.

```tsx
function Component() {
  const [count, setCount] = useState(0)
  const handlerRef = useRef(() => {
    console.log(count)
  })

  // 리렌더링 없이 ref 업데이트
  handlerRef.current = () => {
    console.log(count)
  }

  useEffect(() => {
    const handler = () => handlerRef.current()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
}
```

### 8.2 안정적인 콜백 Ref를 위한 useLatest

안정적인 콜백 ref를 위해 `useLatest`를 사용합니다.

```tsx
function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value)
  ref.current = value
  return ref
}

function Component() {
  const [count, setCount] = useState(0)
  const latestCount = useLatest(count)

  useEffect(() => {
    const interval = setInterval(() => {
      console.log(latestCount.current)
    }, 1000)
    return () => clearInterval(interval)
  }, [latestCount])

  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
}
```

---

## 참고

모든 규칙이 확장된 전체 가이드는 Vercel React Best Practices 리포지토리와 문서를 참조하세요.

---

Version: 1.0.0
Last Updated: 2026-01-15
Source: Vercel Engineering
