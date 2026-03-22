# SPEC-NEXTJS-MIGRATION-001: 인수 기준

## 추적성 태그
- SPEC-NEXTJS-MIGRATION-001-R1 ~ R5

---

## Phase 1: Next.js 프로젝트 초기화 인수 기준

### AC-1.1: Next.js 개발 서버 기동

```gherkin
Given Next.js App Router 프로젝트가 초기화되었을 때
When `pnpm dev`를 실행하면
Then 개발 서버가 오류 없이 기동되어야 한다
And 브라우저에서 localhost 접근 시 기본 페이지가 렌더링되어야 한다
```

### AC-1.2: Tailwind CSS 동작 확인

```gherkin
Given Tailwind CSS 4가 Next.js에 통합되었을 때
When Tailwind 유틸리티 클래스(예: `bg-blue-500`, `text-white`)를 사용하면
Then 스타일이 정상적으로 적용되어야 한다
And CSS 변수 기반 테마(OKLch)가 정상 동작해야 한다
```

### AC-1.3: TypeScript 설정 호환

```gherkin
Given tsconfig.json이 Next.js 호환으로 업데이트되었을 때
When `npx tsc --noEmit`을 실행하면
Then 타입 오류가 0건이어야 한다
And 경로 별칭(@/)이 정상 해석되어야 한다
```

---

## Phase 2: MUI 제거 인수 기준

### AC-2.1: MUI 의존성 완전 제거

```gherkin
Given MUI 제거 작업이 완료되었을 때
When package.json의 dependencies를 확인하면
Then @mui/material이 없어야 한다
And @mui/icons-material이 없어야 한다
And @emotion/react이 없어야 한다
And @emotion/styled이 없어야 한다
```

### AC-2.2: MUI import 제거 확인

```gherkin
Given MUI 컴포넌트가 교체되었을 때
When 프로젝트 전체에서 "@mui" 문자열을 검색하면
Then 검색 결과가 0건이어야 한다
And "@emotion" 문자열 검색 결과도 0건이어야 한다
```

### AC-2.3: shadcn/ui 대체 기능 동등성

```gherkin
Given MUI 컴포넌트가 shadcn/ui로 교체되었을 때
When 교체된 UI 요소를 확인하면
Then 기존 MUI 컴포넌트와 동일한 기능을 제공해야 한다
And 시각적으로 일관된 디자인이어야 한다
```

---

## Phase 3: 레이아웃 및 라우팅 인수 기준

### AC-3.1: 페이지 라우팅

```gherkin
Given Next.js App Router가 설정되었을 때
When 사용자가 "/" 경로에 접근하면
Then 메인 문서 생성 인터페이스가 표시되어야 한다

When 사용자가 "/history" 경로에 접근하면
Then 생성 이력 페이지가 표시되어야 한다

When 사용자가 "/settings" 경로에 접근하면
Then AI 제공자 설정 페이지가 표시되어야 한다
```

### AC-3.2: 공통 레이아웃 유지

```gherkin
Given 루트 레이아웃이 구현되었을 때
When 어떤 페이지에 접근하더라도
Then 공통 헤더가 표시되어야 한다
And 공통 푸터가 표시되어야 한다
And 페이지 간 네비게이션 링크가 동작해야 한다
```

### AC-3.3: 상태 분산

```gherkin
Given 상태 관리가 페이지별로 분산되었을 때
When 메인 페이지(/)에서 프롬프트를 입력하면
Then 입력 상태가 메인 페이지 내에서 정상 관리되어야 한다

When 설정 페이지(/settings)에서 AI 제공자를 설정하면
Then 설정 상태가 메인 페이지에서 참조 가능해야 한다
```

---

## Phase 4: 컴포넌트 마이그레이션 인수 기준

### AC-4.1: 컴포넌트 정상 렌더링

```gherkin
Given 모든 컴포넌트가 Next.js 구조로 이동되었을 때
When 메인 페이지를 로드하면
Then ConfigurationPanel이 정상 렌더링되어야 한다
And SystemPromptSection이 정상 렌더링되어야 한다
And UserPromptSection이 정상 렌더링되어야 한다
And SchemaSection이 정상 렌더링되어야 한다
And InputDataSection이 정상 렌더링되어야 한다
And FileUploadSection이 정상 렌더링되어야 한다
And OutputDataSection이 정상 렌더링되어야 한다
```

### AC-4.2: 다크모드 동작

```gherkin
Given 스타일이 마이그레이션되었을 때
When 다크모드를 토글하면
Then 모든 컴포넌트의 색상이 다크 테마로 전환되어야 한다
And CSS 변수(OKLch 기반)가 정상 적용되어야 한다
And 페이지 새로고침 후에도 테마 설정이 유지되어야 한다
```

### AC-4.3: 반응형 레이아웃

```gherkin
Given 스타일이 마이그레이션되었을 때
When 데스크톱 뷰포트(1024px 이상)에서 메인 페이지를 보면
Then 2컬럼 레이아웃(좌측=설정, 우측=출력)이 표시되어야 한다

When 모바일 뷰포트(768px 미만)에서 메인 페이지를 보면
Then 단일 컬럼 레이아웃으로 전환되어야 한다
```

### AC-4.4: 'use client' 지시어

```gherkin
Given 컴포넌트가 Next.js 구조로 이동되었을 때
When useState, useEffect, 이벤트 핸들러를 사용하는 컴포넌트를 확인하면
Then 해당 컴포넌트 파일 최상단에 'use client' 지시어가 있어야 한다
```

---

## Phase 5: 정리 및 검증 인수 기준

### AC-5.1: 불필요한 의존성 제거

```gherkin
Given 정리 작업이 완료되었을 때
When package.json을 확인하면
Then vite가 없어야 한다
And @vitejs/plugin-react가 없어야 한다
And @tailwindcss/vite가 없어야 한다
And react-router가 없어야 한다
And react-router-dom이 없어야 한다
```

### AC-5.2: Vite 설정 파일 제거

```gherkin
Given 정리 작업이 완료되었을 때
When 프로젝트 루트를 확인하면
Then vite.config.ts 파일이 없어야 한다
And index.html 파일이 없어야 한다 (Next.js가 자동 생성)
```

### AC-5.3: 프로덕션 빌드 성공

```gherkin
Given 전체 마이그레이션이 완료되었을 때
When `pnpm build`를 실행하면
Then 빌드가 오류 없이 성공해야 한다
And 빌드 출력(.next/)이 생성되어야 한다
```

### AC-5.4: 개발 서버 기동

```gherkin
Given 전체 마이그레이션이 완료되었을 때
When `pnpm dev`를 실행하면
Then 개발 서버가 오류 없이 기동되어야 한다
And 모든 페이지(/, /history, /settings)에 접근 가능해야 한다
```

### AC-5.5: 기능 동등성 최종 확인

```gherkin
Given 전체 마이그레이션이 완료되었을 때
When 다음 기능을 순차적으로 테스트하면:
  - AI 제공자 설정 (활성화/비활성화, API Key 입력, 모델 선택)
  - System Prompt 입력
  - User Prompt 입력
  - JSON Schema 편집
  - 동적 입력 데이터 추가/삭제
  - 파일 업로드
  - 문서 생성 (Mock)
  - 출력 탭 전환 및 결과 확인
  - 다크모드 토글
Then 모든 기능이 기존 SPA와 동등하게 동작해야 한다
```

---

## Quality Gate 기준

| 항목 | 기준 |
|------|------|
| TypeScript 타입 오류 | 0건 |
| 빌드 성공 | `pnpm build` 오류 0건 |
| MUI/Emotion 잔존 | import 0건 |
| Vite 잔존 | 설정 파일 및 의존성 0건 |
| 기능 회귀 | 기존 기능 100% 동작 |
| 시각적 일관성 | 다크모드, 반응형, 테마 정상 |

---

## Definition of Done

1. 모든 Phase(1~5)의 인수 기준이 통과됨
2. `pnpm build` 및 `pnpm dev` 정상 동작
3. TypeScript 타입 오류 0건
4. MUI/Emotion/Vite 관련 코드 및 의존성 완전 제거
5. 기존 SPA의 모든 기능이 Next.js App Router에서 동등하게 동작
6. 다크모드, 반응형 레이아웃, OKLch 테마 시스템 정상 동작
