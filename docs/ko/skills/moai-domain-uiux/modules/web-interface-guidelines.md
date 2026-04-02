# 웹 인터페이스 가이드라인

Vercel Labs의 종합 웹 인터페이스 가이드라인 준수 검사기입니다. 접근성, 성능, UX, 구현 모범 사례에 대해 UI 코드를 검토합니다.

---

## 개요

웹 인터페이스 가이드라인은 접근 가능하고, 성능이 좋으며, 사용자 친화적인 웹 인터페이스를 구축하기 위한 포괄적인 규칙 모음입니다. 이 가이드라인은 HTML 구조, 접근성(a11y), 폼, 애니메이션, 타이포그래피, 콘텐츠 처리, 이미지, 성능, 내비게이션, 터치 인터랙션, 레이아웃, 테마를 다룹니다.

### 가이드라인 출처

최신 가이드라인은 다음에서 관리됩니다:
https://github.com/vercel-labs/web-interface-guidelines

### 사용 패턴

다음과 같은 경우에 이 가이드라인을 사용하세요:
- UI 코드의 준수 문제를 검토할 때
- 새로운 컴포넌트나 페이지를 구현할 때
- 접근성 감사를 수행할 때
- 웹 성능을 최적화할 때
- 일관된 UX 패턴을 보장할 때

---

## HTML 구조

### 문서 구조

- 시맨틱 HTML5 요소 사용 (`<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`)
- `<html>` 요소에 적절한 lang 속성 포함
- 적절한 제목 계층 구조 보장 (레벨 건너뛰기 없음)
- 메인 콘텐츠로의 건너뛰기 링크 포함
- 올바른 스크롤 위치를 위해 제목 앵커에 `scroll-margin-top` 추가

예시:
```tsx
export default function Layout() {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only">
          메인 콘텐츠로 건너뛰기
        </a>
        <Header />
        <main id="main" style={{ scrollMarginTop: 80 }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
```

### 시맨틱 HTML

일반 div 대신 적절한 시맨틱 요소를 사용하세요:
- `<nav>` - 내비게이션 메뉴
- `<main>` - 주요 콘텐츠
- `<article>` - 독립적인 콘텐츠
- `<section>` - 주제별 그룹핑
- `<aside>` - 관련 부가 콘텐츠
- `<header>` 및 `<footer>` - 섹션 헤더/푸터

---

## 접근성 (a11y)

### 포커스 상태

- 대화형 요소에 시각적 포커스 필요: `focus-visible:ring-*` 또는 동등한 스타일
- 포커스 대체 없이 `outline-none` / `outline: none` 사용 금지
- `:focus` 대신 `:focus-visible` 사용 (클릭 시 포커스 링 방지)
- 복합 컨트롤에 `:focus-within`으로 그룹 포커스

예시:
```tsx
// 올바른 포커스 상태
<button className="focus-visible:ring-2 focus-visible:ring-blue-500">
  클릭하세요
</button>

// 복합 컨트롤 포커스
<div className="focus-within:ring-2 focus-within:ring-blue-500">
  <input type="text" placeholder="검색..." />
  <button>검색</button>
</div>
```

### ARIA 속성

- 아이콘 전용 버튼에 `aria-label` 사용
- 추가 컨텍스트에 `aria-describedby` 사용
- 동적 콘텐츠 영역에 `aria-live` 사용
- 토글 컨트롤에 `aria-expanded` 사용
- ARIA보다 적절한 제목 계층 우선 사용 (네이티브 HTML 우선)
- 필요한 경우에만 `role` 사용 (시맨틱 HTML 선호)

예시:
```tsx
// aria-label이 있는 아이콘 버튼
<button aria-label="대화상자 닫기">
  <XIcon />
</button>

// 추가 컨텍스트 설명
<input
  type="text"
  aria-describedby="password-hint"
/>
<p id="password-hint">8자 이상이어야 합니다</p>

// 동적 콘텐츠를 위한 라이브 영역
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### 키보드 내비게이션

- 모든 대화형 요소가 키보드로 접근 가능해야 합니다
- 시각적 포커스 인디케이터 제공
- 적절한 곳에서 Tab, Enter, Escape, 화살표 키 지원
- 논리적 탭 순서 보장
- 모달에 키보드 트랩 구현

---

## 폼

### 입력 필드 모범 사례

- 입력 필드에 `autocomplete`와 의미 있는 `name` 필요
- 올바른 `type` (`email`, `tel`, `url`, `number`) 및 `inputmode` 사용
- 절대 붙여넣기를 차단하지 마세요 (`onPaste` + `preventDefault`)
- 레이블을 클릭 가능하게 (`htmlFor` 또는 컨트롤 감싸기)
- 이메일, 코드, 사용자명에 맞춤법 검사 비활성화 (`spellCheck={false}`)

예시:
```tsx
<form>
  <label htmlFor="email">이메일</label>
  <input
    id="email"
    type="email"
    name="email"
    autoComplete="email"
    inputMode="email"
    spellCheck={false}
    placeholder="you@example.com"
    required
  />
</form>
```

### 체크박스 및 라디오

- 레이블과 컨트롤이 하나의 히트 타겟을 공유 (데드 존 없음)
- `<fieldset>`과 `<legend>`로 적절히 그룹핑

예시:
```tsx
// 올바름: 레이블이 컨트롤을 감싸 단일 히트 타겟 형성
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" name="subscribe" value="yes" />
  <span>뉴스레터 구독</span>
</label>

// fieldset으로 그룹핑
<fieldset>
  <legend>알림 환경설정</legend>
  <label>
    <input type="radio" name="notifications" value="email" />
    이메일
  </label>
  <label>
    <input type="radio" name="notifications" value="sms" />
    SMS
  </label>
</fieldset>
```

### 폼 유효성 검사

- 제출 버튼은 요청 시작 전까지 활성화 유지; 요청 중 스피너 표시
- 오류는 필드 옆에 인라인으로; 제출 시 첫 번째 오류에 포커스
- 플레이스홀더는 `...`로 끝나고 예시 패턴 표시
- 비인증 필드에 `autocomplete="off"`로 비밀번호 관리자 트리거 방지
- 저장되지 않은 변경사항이 있을 때 페이지 이동 전 경고

예시:
```tsx
function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors = validate(formData)
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      // 첫 번째 오류에 포커스
      const firstErrorField = document.getElementById(Object.keys(newErrors)[0])
      firstErrorField?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await submitForm(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com..."
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="error">
            {errors.email}
          </p>
        )}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : '제출'}
      </button>
    </form>
  )
}
```

---

## 애니메이션

### 성능 가이드라인

- `prefers-reduced-motion` 존중 (감소된 변형 제공 또는 비활성화)
- `transform`/`opacity`만 애니메이션 (컴포지터 친화적)
- 절대 `transition: all` 사용 금지 - 속성을 명시적으로 나열
- 올바른 `transform-origin` 설정
- SVG: `<g>` 래퍼에 `transform-box: fill-box; transform-origin: center`로 트랜스폼 적용
- 애니메이션은 중단 가능해야 함 - 애니메이션 도중 사용자 입력에 응답

예시:
```tsx
// 올바름: 모션 감소 지원과 명시적 속성
const buttonVariants = cva({
  base: 'transition-transform duration-200',
  variants: {
    hover: {
      true: 'hover:scale-105'
    }
  }
})

function AnimatedButton() {
  return (
    <button className={buttonVariants({ hover: true })}>
      클릭하세요
    </button>
  )
}

// 모션 감소 쿼리
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 타이포그래피

### 모범 사례

- 마침표 세 개(`...`) 대신 말줄임표(`...`) 사용
- 직선 따옴표(`""`) 대신 곡선 따옴표(`""`) 사용
- 줄바꿈 방지 공백 사용: `10 MB`, `Cmd K`, 브랜드명
- 로딩 상태는 말줄임표로 끝남: `"로딩 중..."`, `"저장 중..."`
- 숫자 열/비교에 `font-variant-numeric: tabular-nums`
- 제목에 `text-wrap: balance` 또는 `text-wrap: pretty` 사용 (외톨이 단어 방지)

예시:
```tsx
function Typography() {
  return (
    <div>
      <h1 className="text-wrap-balance">
        외톨이 단어가 없어야 하는 제목
      </h1>
      <p>로딩 중...</p>
      <table>
        <td className="font-variant-numeric: tabular-nums">
          1,234,567
        </td>
      </table>
    </div>
  )
}
```

---

## 콘텐츠 처리

### 텍스트 컨테이너

- 텍스트 컨테이너가 긴 콘텐츠를 처리: `truncate`, `line-clamp-*`, 또는 `break-words`
- Flex 자식 요소에 텍스트 잘림을 허용하려면 `min-w-0` 필요
- 빈 상태 처리 - 빈 문자열/배열에 깨진 UI를 렌더링하지 않기
- 사용자 생성 콘텐츠: 짧은, 평균적인, 매우 긴 입력을 예상

예시:
```tsx
// flex 컨테이너에서 텍스트 잘림
<div className="flex min-w-0">
  <span className="truncate">{longTitle}</span>
</div>

// 줄 수 제한
<p className="line-clamp-3">
  {longDescription}
</p>

// 빈 상태 처리
function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return <EmptyState message="아직 게시물이 없습니다" />
  }
  return posts.map(post => <PostCard key={post.id} post={post} />)
}
```

---

## 이미지

### 모범 사례

- `<img>`에 명시적 `width`와 `height` 필요 (CLS 방지)
- 하단 이미지: `loading="lazy"`
- 상단 중요 이미지: `priority` 또는 `fetchpriority="high"`

예시:
```tsx
// Next.js Image 컴포넌트
import Image from 'next/image'

// 상단: priority
function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="히어로 이미지"
      width={1200}
      height={600}
      priority
    />
  )
}

// 하단: 지연 로딩
function Gallery() {
  return (
    <Image
      src="/photo.jpg"
      alt="갤러리 사진"
      width={800}
      height={600}
      loading="lazy"
    />
  )
}
```

---

## 성능

### 최적화 가이드라인

- 대형 목록 (50개 이상): 가상화 (`virtua`, `content-visibility: auto`)
- 렌더링에서 레이아웃 읽기 금지 (`getBoundingClientRect`, `offsetHeight`, `offsetWidth`, `scrollTop`)
- DOM 읽기/쓰기를 배치 처리; 교차 배치 금지
- 비제어 입력 선호; 제어 입력은 키 입력당 비용이 저렴해야 함
- CDN/에셋 도메인에 `<link rel="preconnect">` 추가
- 중요 폰트: `font-display: swap`과 함께 `<link rel="preload">`

예시:
```tsx
// 대규모 데이터셋을 위한 가상 리스트
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
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

// CDN 도메인에 preconnect
export default function RootLayout() {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://cdn.example.com" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

## 내비게이션 및 상태

### URL 상태 관리

- URL이 상태를 반영 - 필터, 탭, 페이지네이션, 확장된 패널을 쿼리 파라미터에
- 링크는 `<Link>`/`<a>` 사용 (Cmd/Ctrl+클릭, 미들 클릭 지원)
- 모든 상태 기반 UI를 딥 링크 (useState를 사용한다면 nuqs 등으로 URL 동기화 고려)
- 파괴적 작업에는 확인 모달 또는 실행 취소 창 필요 - 절대 즉시 실행 금지

예시:
```tsx
// nuqs를 활용한 URL 상태
import { useQueryState } from 'nuqs'

function ProductList() {
  const [category, setCategory] = useQueryState('category')
  const [page, setPage] = useQueryState('page', { defaultValue: '1' })

  return (
    <div>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">전체</option>
        <option value="electronics">전자제품</option>
      </select>
      <ProductGrid category={category} page={page} />
      <Link href={`?category=${category}&page=${Number(page) + 1}`}>
        다음 페이지
      </Link>
    </div>
  )
}

// 확인이 필요한 파괴적 작업
function DeleteButton({ id }: { id: string }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    await deleteItem(id)
    setShowConfirm(false)
  }

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>삭제</button>
      {showConfirm && (
        <ConfirmDialog
          message="이 항목을 삭제하시겠습니까?"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
```

---

## 터치 및 인터랙션

### 터치 가이드라인

- `touch-action: manipulation` (더블 탭 줌 지연 방지)
- `-webkit-tap-highlight-color`를 의도적으로 설정
- 모달/드로어/시트에 `overscroll-behavior: contain`
- 드래그 중: 텍스트 선택 비활성화, 드래그 요소에 `inert`
- `autoFocus`는 절제하여 사용 - 데스크탑 전용, 단일 주요 입력; 모바일에서는 지양

예시:
```tsx
// 터치 친화적 버튼
const button = cva({
  base: 'touch-action-manipulation -webkit-tap-highlight-color-transparent'
})

// overscroll 억제가 적용된 모달
function Modal() {
  return (
    <div className="overscroll-behavior-contain">
      <div className="backdrop">...</div>
      <div className="content">...</div>
    </div>
  )
}
```

### 모바일 우선 UX 패턴

#### 터치 타겟 크기
- 최소 터치 타겟: 44x44px (WCAG 2.5.5)
- 권장: 주요 액션에 48x48px
- 타겟 간 간격: 최소 8px
- 엄지 영역 최적화: 주요 액션을 화면 하단 1/3에 배치

#### 제스처 디자인
- 스와이프: 가로는 내비게이션, 세로는 스크롤/닫기
- 길게 누르기: 보조 액션, 컨텍스트 메뉴
- 핀치: 줌 및 스케일 작업
- 아래로 당기기: 목록 상단 새로고침 패턴

#### 모바일 인터랙션 패턴
- 바텀 시트로 컨텍스트 액션 (데스크탑 모달 대체)
- 콘텐츠 업데이트를 위한 당겨서 새로고침
- 주요 생성 액션을 위한 플로팅 액션 버튼(FAB)
- 최상위 내비게이션을 위한 탭 바 (최대 5개 항목)
- 확인 및 상태 변경을 위한 햅틱 피드백

---

## 안전 영역 및 레이아웃

### 레이아웃 가이드라인

- 전체 너비 레이아웃에 노치를 위한 `env(safe-area-inset-*)` 필요
- 원치 않는 스크롤바 방지: 컨테이너에 `overflow-x-hidden`, 콘텐츠 오버플로우 수정
- JS 측정 대신 Flex/Grid 사용

예시:
```tsx
// 노치 장치를 위한 안전 영역 처리
function FullBleedLayout() {
  return (
    <div
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {children}
    </div>
  )
}
```

---

## 다크 모드 및 테마

### 테마 구현

- 다크 테마에 `<html>`에 `color-scheme: dark` (스크롤바, 입력 필드 수정)
- `<body>`가 페이지 배경과 일치

예시:
```tsx
// color-scheme을 활용한 다크 모드
export default function RootLayout() {
  return (
    <html className="dark" style={{ colorScheme: 'dark' }}>
      <body className="bg-gray-950 text-gray-50">
        {children}
      </body>
    </html>
  )
}
```

---

## 디자인 방향성과 Anti-AI Slop 방지

### 디자인 사고 프로세스

모든 UI 프로젝트는 구현 전에 의도적인 디자인 방향 프로세스를 거쳐야 합니다:

1. **목적**: 이 인터페이스가 달성하려는 것은 무엇인가? 어떤 느낌을 불러일으켜야 하는가?
2. **톤**: 이 제품의 성격은? (격식/비격식, 장난스러운/진지한, 따뜻한/차가운)
3. **제약 조건**: 브랜드 가이드라인, 기술적 한계, 접근성 요구사항은?
4. **차별화**: 일반적인 AI 생성 인터페이스와 어떻게 다르게 보일 것인가?

### 금지 패턴 (AI Slop 지표)

이 패턴들은 게으르고 차별화되지 않은 AI 생성 디자인을 나타냅니다:

**타이포그래피**:
- 금지: Inter, Roboto, Arial을 주 폰트로 사용
- 금지: 의도적 페어링 없는 시스템 폰트 스택
- 금지: "모던한" 기본값으로 Space Grotesk 사용
- 대안: 제품 성격을 반영하는 독특한 폰트 페어링 선택

**색상**:
- 금지: 흰 배경 위 보라-파랑 그라데이션
- 금지: 일반적인 틸/코랄 포인트 색상
- 대안: 선명하고 의도적인 포인트 색상과 함께 지배적 브랜드 색상
- 대안: 텍스처 변형이 있는 모노크로매틱 스킴

**레이아웃**:
- 금지: 예측 가능한 히어로 -> 기능 그리드 -> 추천 -> CTA 패턴
- 금지: 동일 간격의 대칭 카드 그리드
- 대안: 비대칭 공간 구성
- 대안: 디자인 요소로서의 의도적 여백

### 스타일 극단 가이드

"깔끔하고 모던한" 기본값 대신 이 극단들에서 디자인 방향을 선택하세요:

| 스타일 | 특성 | 사용 시점 |
|--------|------|----------|
| 극단적 미니멀 | 최대 여백, 단일 서체, 장식 없음 | 개발자 도구, 생산성 앱 |
| 최대주의 카오스 | 밀집 정보, 겹치는 요소, 풍부한 색상 | 창작 도구, 엔터테인먼트 |
| 레트로 퓨처리스틱 | CRT 미학, 모노스페이스 폰트, 터미널 영감 | 테크 지향 제품, CLI 도구 |
| 유기적/자연적 | 부드러운 곡선, 대지 톤, 손그림 요소 | 웰니스, 지속가능성 브랜드 |
| 럭셔리/세련 | 세리프 폰트, 넉넉한 간격, 차분한 팔레트 | 프리미엄 제품, 금융 |
| 장난스러운/장난감 같은 | 둥근 형태, 밝은 색상, 탄력있는 애니메이션 | 소비자 앱, 어린이 제품 |
| 에디토리얼/매거진 | 강한 타이포그래피 계층, 그리드 기반, 사진 중심 | 콘텐츠 중심 사이트, 블로그 |
| 브루탈리스트/로우 | 노출된 구조, 시스템 폰트, 최소 CSS | 아트, 실험 프로젝트 |
| 아르데코/기하학적 | 금색 포인트, 대칭 패턴, 장식 폰트 | 패션, 호텔 |
| 소프트/파스텔 | 차분한 색상, 둥근 모서리, 부드러운 그라데이션 | 건강, 교육 |
| 산업/실용적 | 모노스페이스, 고대비, 밀집 정보 | 데이터 대시보드, 모니터링 |

### 분위기 있는 배경

평면 흰/회색 배경을 텍스처가 있는 대안으로 교체:

- 미묘한 색상 변화가 있는 그라데이션 메쉬
- 노이즈 텍스처 (SVG 필터: feTurbulence)
- 그레인 오버레이 (CSS: 노이즈를 활용한 background-image)
- 미묘한 패턴 배경 (점, 선, 크로스해치)
- backdrop-filter를 활용한 글래스모피즘

---

## 모션 및 마이크로인터랙션 디자인

### 전환 타이밍

- 기본 지속 시간: UI 상태 변경에 200-300ms
- 페이지 전환: 400-600ms
- 복합 애니메이션: 600-1000ms
- 이징: cubic-bezier 곡선 사용, UI 요소에 linear 사용 금지
  - 진입: cubic-bezier(0, 0, 0.2, 1) - 감속
  - 퇴장: cubic-bezier(0.4, 0, 1, 1) - 가속
  - 표준: cubic-bezier(0.4, 0, 0.2, 1) - 표준 이즈

### 진입 및 퇴장 패턴

- 콘텐츠 등장에 페이드 + 이동(8-16px)
- 모달 및 대화상자에 0.95에서 1.0으로 스케일
- 드로어와 패널에 가장자리에서 슬라이드
- 전문적 UI에 바운스 또는 탄성 이징 사용 금지

### 스태거 패턴

- 목록 항목: 항목 간 50ms 스태거
- 그리드 항목: 30-50ms 스태거, 행 우선 또는 대각선
- 최대 스태거 그룹: 8-10개 항목 (초과 시 일괄 노출 사용)

### 스크롤 트리거 효과

- 스크롤 기반 노출에 Intersection Observer
- 패럴랙스: 미묘하게 (0.1-0.3 팩터), 극단적 사용 금지
- 스크롤에 따른 점진적 공개 (지연 콘텐츠 로딩)
- 스크롤 연동 진행 인디케이터

### 모션 감소

- 항상 prefers-reduced-motion 존중
- 대체로 즉각적 상태 변경 제공
- 감소 모드에서도 필수 모션(로딩 인디케이터) 유지

---

## 검토 체크리스트

UI 코드를 검토할 때 확인할 사항:

### HTML 및 구조
- [ ] 시맨틱 HTML5 요소가 적절히 사용됨
- [ ] 적절한 제목 계층 (레벨 건너뛰기 없음)
- [ ] 메인 콘텐츠 건너뛰기 링크 포함
- [ ] 제목 앵커에 `scroll-margin-top` 적용

### 접근성
- [ ] 모든 대화형 요소에 시각적 포커스 상태
- [ ] `:focus` 대신 `:focus-visible` 사용
- [ ] 아이콘 전용 버튼에 ARIA 레이블
- [ ] 키보드 내비게이션 구현
- [ ] 스크린 리더 최적화 적용

### 폼
- [ ] 입력에 `autocomplete`와 의미 있는 `name` 포함
- [ ] 올바른 `type`과 `inputmode` 사용
- [ ] 붙여넣기 차단하지 않음
- [ ] 레이블 클릭 가능 (컨트롤 감싸기 또는 `htmlFor`)
- [ ] 적절한 필드에 맞춤법 검사 비활성화
- [ ] 체크박스/라디오에 단일 히트 타겟
- [ ] 포커스 관리가 포함된 인라인 오류 메시지
- [ ] 플레이스홀더가 `...`로 끝남

### 애니메이션
- [ ] `prefers-reduced-motion` 존중
- [ ] `transform`/`opacity`만 애니메이션
- [ ] 속성이 명시적으로 나열 (`transition: all` 사용 안 함)
- [ ] 애니메이션 중단 가능

### 타이포그래피
- [ ] 마침표 세 개 대신 말줄임표(`...`) 사용
- [ ] 곡선 따옴표 사용
- [ ] 적절한 콘텐츠에 줄바꿈 방지 공백
- [ ] 로딩 상태가 `...`로 끝남
- [ ] 숫자 열에 `tabular-nums`
- [ ] 제목에 `text-wrap: balance`

### 콘텐츠
- [ ] 텍스트 컨테이너가 오버플로우 처리 (`truncate`, `line-clamp`, `break-words`)
- [ ] Flex 자식에 잘림을 위한 `min-w-0`
- [ ] 빈 상태가 우아하게 처리됨

### 이미지
- [ ] 이미지에 명시적 `width`와 `height`
- [ ] 하단 이미지에 지연 로딩
- [ ] 상단 중요 이미지에 priority

### 성능
- [ ] 대형 목록 가상화
- [ ] 렌더링에서 레이아웃 읽기 없음
- [ ] DOM 읽기/쓰기 배치 처리
- [ ] CDN 도메인에 preconnect 태그
- [ ] 중요 폰트 프리로딩

### 내비게이션
- [ ] URL 상태가 쿼리 파라미터에 반영
- [ ] 링크가 적절한 앵커 태그 사용
- [ ] 딥 링킹 구현
- [ ] 파괴적 작업에 확인 존재

### 터치
- [ ] `touch-action: manipulation` 적용
- [ ] 모달에 `overscroll-behavior: contain`
- [ ] `autoFocus` 절제 사용

### 레이아웃
- [ ] 노치 장치에 안전 영역 인셋 처리
- [ ] 원치 않는 스크롤바 방지
- [ ] JS 측정 대신 Flex/Grid 사용

### 테마
- [ ] 다크 테마에 html 요소에 `color-scheme: dark`
- [ ] body 배경이 페이지 배경과 일치

---

## 리소스

- 공식 저장소: https://github.com/vercel-labs/web-interface-guidelines
- 관련: WAI-ARIA 작성 관행: https://www.w3.org/WAI/ARIA/apg/
- 관련: WCAG 2.2 빠른 참조: https://www.w3.org/WAI/WCAG22/quickref/

---

버전: 1.0.0
최종 업데이트: 2026-01-15
출처: Vercel Labs Web Interface Guidelines
