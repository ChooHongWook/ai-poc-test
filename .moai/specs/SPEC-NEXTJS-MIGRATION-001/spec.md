# SPEC-NEXTJS-MIGRATION-001: Vite + React SPA를 Next.js App Router로 마이그레이션

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-NEXTJS-MIGRATION-001 |
| 제목 | Vite + React SPA를 Next.js App Router로 마이그레이션 |
| 생성일 | 2026-03-22 |
| 완료일 | 2026-03-22 |
| 상태 | Completed |
| 우선순위 | High |
| 라이프사이클 | spec-first |

---

## Environment (환경)

### 현재 기술 스택
- **빌드 도구**: Vite 6.3.5 + @vitejs/plugin-react
- **프레임워크**: React 19.2.4 (SPA, 단일 페이지)
- **언어**: TypeScript 5.9.3
- **스타일링**: Tailwind CSS 4.1.12 (@tailwindcss/vite 플러그인)
- **컴포넌트**: shadcn/ui (Radix UI 기반, 45+ 컴포넌트) + MUI Material 7.3.5
- **MUI 의존성**: @emotion/react 11.14.x, @emotion/styled
- **라이브러리**: react-hook-form, lucide-react, sonner, recharts, motion, date-fns, react-dnd, clsx, tailwind-merge, class-variance-authority
- **테마**: next-themes 0.4.6
- **미사용 의존성**: react-router 7.13.0 (설치됨, 사용 안 함)
- **패키지 매니저**: pnpm
- **테스트/린트**: 미설정

### 현재 아키텍처
- 진입점: `index.html` -> `src/main.tsx` -> `src/app/App.tsx`
- 상태 관리: App.tsx에서 useState로 모든 상태 관리
- 레이아웃: 2컬럼 그리드 (좌측=설정, 우측=출력)
- 컴포넌트 경로: `src/app/components/` (기능) + `src/app/components/ui/` (shadcn)
- 스타일 경로: `src/styles/` (index.css, tailwind.css, theme.css, fonts.css)
- API: Mock 전용 (실제 AI API 미연동, 2초 딜레이 시뮬레이션)

### 목표 기술 스택
- **프레임워크**: Next.js (App Router)
- **컴포넌트**: shadcn/ui 단일 통합 (MUI 제거)
- **라우팅**: Next.js App Router 기반 멀티페이지
- **API**: Mock 유지 (실제 API 연동은 별도 향후 작업)

---

## Assumptions (가정)

1. Next.js는 최신 안정 버전을 사용한다
2. Tailwind CSS 4는 Next.js 환경에서 정상 동작한다
3. shadcn/ui 컴포넌트는 Next.js App Router와 호환된다
4. next-themes는 Next.js 환경에서 기본 지원되므로 별도 설정 없이 사용 가능하다
5. 현재 MUI 사용 범위가 제한적이어서 shadcn/ui로 완전 대체 가능하다
6. Mock API 로직은 클라이언트 사이드에서 유지한다 (Server Action 불필요)
7. react-dnd, recharts, motion 등 기존 라이브러리는 Next.js 환경에서 'use client' 지시어로 정상 동작한다
8. 기존 CSS 변수 기반 테마 시스템(OKLch)은 Next.js로 이전 가능하다

---

## Requirements (요구사항)

### R1: Next.js 프로젝트 초기화 (Phase 1)

**[유비쿼터스]** 시스템은 **항상** Next.js App Router 기반으로 동작해야 한다.

**WHEN** 프로젝트가 초기화될 **THEN** 다음 설정이 완료되어야 한다:
- Next.js App Router 구조 (`app/` 디렉토리)
- TypeScript 5.9+ 설정 (`tsconfig.json`)
- Tailwind CSS 4 통합 설정
- 경로 별칭 설정 (`@/` -> `src/` 또는 프로젝트 루트)
- pnpm 패키지 매니저 유지

### R2: MUI 제거 및 shadcn/ui 통합 (Phase 2)

**WHEN** MUI 컴포넌트가 사용된 곳이 식별되면 **THEN** shadcn/ui 동등 컴포넌트로 교체해야 한다.

**시스템은** @mui/material, @mui/icons-material, @emotion/react, @emotion/styled 의존성을 **포함하지 않아야 한다**.

**WHEN** MUI 아이콘이 사용된 곳이 식별되면 **THEN** lucide-react 아이콘으로 교체해야 한다.

### R3: 레이아웃 및 라우팅 마이그레이션 (Phase 3)

**WHEN** Next.js App Router 구조가 생성되면 **THEN** 다음 페이지 라우트가 구현되어야 한다:
- `/` (메인): AI 문서 생성 인터페이스 (현재 App.tsx 기능)
- `/history`: 생성 이력 조회
- `/settings`: AI 제공자 설정 관리

**WHEN** 사용자가 페이지를 탐색할 **THEN** 공통 레이아웃(헤더, 푸터)이 유지되어야 한다.

**IF** [상태] App.tsx에 모든 상태가 집중되어 있고 **AND WHEN** [이벤트] 멀티페이지로 분리될 **THEN** 상태 관리가 페이지 수준으로 분산되어야 한다.

### R4: 컴포넌트 마이그레이션 (Phase 4)

**WHEN** 컴포넌트가 Next.js 구조로 이동되면 **THEN** 다음 조건을 충족해야 한다:
- 클라이언트 전용 컴포넌트에 `'use client'` 지시어 추가
- shadcn/ui 컴포넌트는 `components/ui/` 경로 유지
- 기능 컴포넌트는 페이지별 또는 공통 디렉토리로 분류

**WHEN** 스타일이 마이그레이션되면 **THEN** 다음이 보장되어야 한다:
- 글로벌 CSS (`globals.css`)에 기존 CSS 변수, 폰트, Tailwind 설정 통합
- OKLch 색상 모델 기반 테마 시스템 유지
- 다크모드 정상 동작

### R5: 정리 및 검증 (Phase 5)

**WHEN** 마이그레이션이 완료되면 **THEN** 다음 의존성이 제거되어야 한다:
- Vite 관련: vite, @vitejs/plugin-react, @tailwindcss/vite
- MUI 관련: @mui/material, @mui/icons-material, @emotion/react, @emotion/styled
- 미사용: react-router, react-router-dom

**시스템은** Vite 설정 파일(vite.config.ts, index.html)을 **포함하지 않아야 한다**.

**WHEN** `pnpm build`가 실행되면 **THEN** 오류 없이 빌드가 성공해야 한다.
**WHEN** `pnpm dev`가 실행되면 **THEN** 개발 서버가 정상 기동되어야 한다.

---

## Specifications (상세 명세)

### S1: 파일 매핑 (현재 -> 목표)

| 현재 경로 | 목표 경로 | 비고 |
|-----------|----------|------|
| `index.html` | 제거 | Next.js가 자동 생성 |
| `src/main.tsx` | 제거 | Next.js가 자동 처리 |
| `src/app/App.tsx` | `app/page.tsx` + 페이지별 분리 | 상태 분산 |
| `src/app/components/ui/*` | `components/ui/*` | shadcn/ui 표준 경로 |
| `src/app/components/ConfigurationPanel.tsx` | `app/(main)/_components/` 또는 `components/` | 페이지별 분류 |
| `src/app/components/AIProviderConfigItem.tsx` | `app/(main)/_components/` 또는 `components/` | 설정 관련 |
| `src/app/components/SystemPromptSection.tsx` | `app/(main)/_components/` | 프롬프트 관련 |
| `src/app/components/UserPromptSection.tsx` | `app/(main)/_components/` | 프롬프트 관련 |
| `src/app/components/SchemaSection.tsx` | `app/(main)/_components/` | 스키마 관련 |
| `src/app/components/InputDataSection.tsx` | `app/(main)/_components/` | 입력 관련 |
| `src/app/components/FileUploadSection.tsx` | `app/(main)/_components/` | 파일 업로드 |
| `src/app/components/OutputDataSection.tsx` | `app/(main)/_components/` | 출력 관련 |
| `src/app/components/AIOutputPreview.tsx` | `app/(main)/_components/` | 출력 미리보기 |
| `src/styles/index.css` | `app/globals.css` | 통합 |
| `src/styles/tailwind.css` | `app/globals.css`에 통합 | Tailwind 설정 |
| `src/styles/theme.css` | `app/globals.css`에 통합 | CSS 변수 |
| `src/styles/fonts.css` | `app/globals.css`에 통합 | 폰트 |
| `vite.config.ts` | 제거 | `next.config.ts`로 대체 |
| `postcss.config.mjs` | 제거 또는 업데이트 | Next.js + Tailwind 4 설정에 맞춤 |

### S2: Next.js App Router 디렉토리 구조

```
v2_ai-poc-test/
├── next.config.ts
├── tsconfig.json
├── package.json
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (html, body, ThemeProvider)
│   ├── globals.css             # 통합 글로벌 스타일
│   ├── page.tsx                # / 메인 페이지 (문서 생성)
│   ├── history/
│   │   └── page.tsx            # /history 생성 이력
│   ├── settings/
│   │   └── page.tsx            # /settings AI 제공자 설정
│   └── (main)/
│       └── _components/        # 메인 페이지 전용 컴포넌트
│           ├── ConfigurationPanel.tsx
│           ├── AIProviderConfigItem.tsx
│           ├── SystemPromptSection.tsx
│           ├── UserPromptSection.tsx
│           ├── SchemaSection.tsx
│           ├── InputDataSection.tsx
│           ├── FileUploadSection.tsx
│           ├── OutputDataSection.tsx
│           └── AIOutputPreview.tsx
├── components/
│   ├── ui/                     # shadcn/ui 컴포넌트 (45+)
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── common/                 # 공통 컴포넌트
│       └── ImageWithFallback.tsx
├── lib/
│   ├── utils.ts                # cn() 유틸리티
│   └── mock/                   # Mock API 로직
└── hooks/
    └── use-mobile.ts           # 모바일 감지 훅
```

### S3: 상태 관리 분산 전략

| 현재 (App.tsx 단일 상태) | 목표 (페이지별 분산) |
|-------------------------|---------------------|
| AI 제공자 설정 상태 | `/settings` 페이지 또는 Context/Zustand |
| 프롬프트 입력 상태 | `/` 메인 페이지 로컬 상태 |
| 스키마/입력 데이터 상태 | `/` 메인 페이지 로컬 상태 |
| 생성 결과 상태 | `/` 메인 페이지 로컬 상태 |
| 생성 이력 상태 | `/history` 페이지 또는 Context/Zustand |
| 테마 상태 | next-themes (전역) |

### S4: MUI -> shadcn/ui 교체 매핑

마이그레이션 시 MUI 컴포넌트가 사용된 모든 파일을 스캔하여 다음 패턴으로 교체:

| MUI 컴포넌트 | shadcn/ui 대체 |
|-------------|---------------|
| `Button` | `<Button>` (shadcn) |
| `TextField` | `<Input>` 또는 `<Textarea>` |
| `Select` | `<Select>` (shadcn) |
| `Dialog` | `<Dialog>` (shadcn) |
| `Tooltip` | `<Tooltip>` (shadcn) |
| `IconButton` | `<Button variant="ghost" size="icon">` |
| MUI Icons | lucide-react 아이콘 |

### S5: 의존성 변경 요약

**추가 예정:**
- next
- @next/env (필요시)

**제거 예정:**
- vite, @vitejs/plugin-react, @tailwindcss/vite
- @mui/material, @mui/icons-material
- @emotion/react, @emotion/styled
- react-router, react-router-dom (미사용)

**유지:**
- react, react-dom (19.2.4)
- typescript (5.9.3)
- tailwindcss (4.1.12)
- 모든 shadcn/ui 관련 (radix-ui/*, clsx, tailwind-merge, class-variance-authority)
- react-hook-form, lucide-react, sonner, recharts, motion, date-fns, react-dnd
- next-themes

---

## 제약사항

1. **Mock API 유지**: 실제 API 라우트를 구현하지 않는다. 기존 Mock 로직을 클라이언트 사이드에서 유지한다.
2. **점진적 마이그레이션**: 각 Phase를 순차적으로 완료한다. Phase 간 의존성이 있다.
3. **기능 동등성**: 마이그레이션 후 기존 SPA의 모든 기능이 동일하게 동작해야 한다.
4. **시각적 일관성**: UI 외형(다크모드, OKLch 테마, 반응형 레이아웃)이 유지되어야 한다.

---

## 추적성 태그

- SPEC-NEXTJS-MIGRATION-001-R1: Next.js 프로젝트 초기화
- SPEC-NEXTJS-MIGRATION-001-R2: MUI 제거
- SPEC-NEXTJS-MIGRATION-001-R3: 라우팅 마이그레이션
- SPEC-NEXTJS-MIGRATION-001-R4: 컴포넌트 마이그레이션
- SPEC-NEXTJS-MIGRATION-001-R5: 정리 및 검증
