---
id: SPEC-REFACTOR-001
version: "1.0.0"
status: draft
created: "2026-03-18"
updated: "2026-03-18"
author: hw
priority: high
issue_number: 0
---

## HISTORY

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-03-18 | hw | 초안 작성 |

---

# SPEC-REFACTOR-001: Vite에서 Next.js App Router로 단계별 마이그레이션

## 1. Environment (환경)

### 1.1 현재 시스템

| 항목 | 상세 |
|------|------|
| 프로젝트 | AI 문서 생성 시스템 (POC -> Production) |
| 빌드 도구 | Vite 6.3.5 + @vitejs/plugin-react 4.7.0 |
| 프레임워크 | React 18.3.1 SPA |
| 진입점 | index.html -> src/main.tsx -> src/app/App.tsx |
| 스타일링 | Tailwind CSS v4.1.12 (@tailwindcss/vite) |
| UI 라이브러리 | Radix UI (50+ 컴포넌트) + shadcn/ui 패턴 |
| 경로 별칭 | @ -> ./src (vite.config.ts) |
| 상태 관리 | useState 기반 로컬 상태 (App.tsx 집중) |
| 라우팅 | React Router v7 설치됨, 미사용 (단일 페이지) |
| 테마 | CSS 변수 기반 테마 시스템 (theme.css), next-themes 0.4.6 설치됨 |

### 1.2 목표 시스템

| 항목 | 상세 |
|------|------|
| 빌드 도구 | Next.js (App Router) |
| 프레임워크 | Next.js + React 18.3.1 |
| 진입점 | app/layout.tsx -> app/page.tsx |
| 스타일링 | Tailwind CSS v4 (@tailwindcss/postcss) |
| UI 라이브러리 | Radix UI (변경 없음) |
| 경로 별칭 | @ -> ./src (tsconfig.json) |
| 테마 | next-themes ThemeProvider 활성화 |

### 1.3 영향 범위

- 비즈니스 컴포넌트: 8개 (use client 디렉티브 추가 필요)
- UI 컴포넌트: 50+개 (변경 없음, Radix UI 100% 호환)
- 설정 파일: 삭제 4개, 생성 3개, 수정 2개
- 위험 수준: Low-Medium

---

## 2. Assumptions (가정)

### 2.1 기술적 가정

- [A-01] Radix UI, motion, sonner, lucide-react, react-hook-form 등 주요 의존성은 Next.js와 100% 호환된다
- [A-02] CSS 변수 기반 테마 시스템(theme.css)은 Next.js에서 변경 없이 동작한다
- [A-03] next-themes 0.4.6이 이미 설치되어 있으므로 ThemeProvider 래핑만 추가하면 된다
- [A-04] Tailwind CSS v4는 @tailwindcss/vite에서 @tailwindcss/postcss로 플러그인만 교체하면 동일하게 동작한다
- [A-05] 현재 단일 페이지 SPA이므로 라우팅 마이그레이션은 불필요하다

### 2.2 비즈니스 가정

- [A-06] 마이그레이션 기간 동안 기존 기능의 동작이 보존되어야 한다
- [A-07] 팀 내부 도구이므로 SEO 최적화는 즉시 필요하지 않다
- [A-08] POC 단계이므로 AI API 연동은 마이그레이션 범위에 포함하지 않는다

---

## 3. Requirements (요구사항)

### 3.1 Module: 빌드 시스템 전환 [REQ-BUILD]

**[REQ-BUILD-001] Ubiquitous - Next.js 빌드 시스템**
시스템은 **항상** Next.js App Router를 빌드 시스템으로 사용해야 한다.

**[REQ-BUILD-002] Event-Driven - Vite 의존성 제거**
**WHEN** Next.js 설정이 완료되면 **THEN** Vite 관련 의존성(vite, @vitejs/plugin-react, @tailwindcss/vite)과 설정 파일(vite.config.ts, index.html)을 제거해야 한다.

**[REQ-BUILD-003] Event-Driven - Tailwind CSS 플러그인 교체**
**WHEN** 빌드 시스템이 Next.js로 전환되면 **THEN** @tailwindcss/vite를 @tailwindcss/postcss로 교체하고 postcss.config.cjs를 생성해야 한다.

**[REQ-BUILD-004] Unwanted - Vite 잔여 설정 금지**
시스템은 마이그레이션 완료 후 Vite 관련 설정 파일이나 의존성을 **포함하지 않아야 한다**.

### 3.2 Module: App Router 구조 [REQ-APPROUTER]

**[REQ-APPROUTER-001] Ubiquitous - 루트 레이아웃**
시스템은 **항상** app/layout.tsx에 루트 레이아웃을 정의하고, HTML 구조, 폰트, 글로벌 스타일, ThemeProvider를 포함해야 한다.

**[REQ-APPROUTER-002] Event-Driven - 진입점 전환**
**WHEN** App Router 구조가 생성되면 **THEN** 기존 진입점(index.html -> src/main.tsx -> App.tsx)을 app/layout.tsx -> app/page.tsx 구조로 전환해야 한다.

**[REQ-APPROUTER-003] State-Driven - 경로 별칭**
**IF** tsconfig.json에 paths 설정이 존재하면 **THEN** @ 별칭이 ./src를 가리키도록 유지해야 한다.

### 3.3 Module: 클라이언트 컴포넌트 [REQ-CLIENT]

**[REQ-CLIENT-001] Ubiquitous - use client 디렉티브**
시스템은 **항상** React 상태(useState, useEffect 등)를 사용하는 비즈니스 컴포넌트에 "use client" 디렉티브를 선언해야 한다.

**[REQ-CLIENT-002] State-Driven - 클라이언트 컴포넌트 식별**
**IF** 컴포넌트가 useState, useEffect, useRef, 이벤트 핸들러 또는 브라우저 API를 사용하면 **THEN** 해당 컴포넌트 파일 최상단에 "use client"를 추가해야 한다.

**[REQ-CLIENT-003] Unwanted - 불필요한 use client 금지**
시스템은 상태나 브라우저 API를 사용하지 않는 컴포넌트에 "use client" 디렉티브를 **추가하지 않아야 한다**.

### 3.4 Module: 테마 시스템 [REQ-THEME]

**[REQ-THEME-001] Event-Driven - ThemeProvider 구현**
**WHEN** app/layout.tsx가 생성되면 **THEN** next-themes의 ThemeProvider로 children을 래핑하고, attribute="class" 설정을 적용해야 한다.

**[REQ-THEME-002] Ubiquitous - CSS 변수 테마 호환**
시스템은 **항상** 기존 theme.css의 CSS 변수 기반 테마 시스템을 변경 없이 유지해야 한다.

### 3.5 Module: 선택적 최적화 [REQ-OPT]

**[REQ-OPT-001] Optional - 미사용 의존성 정리**
**가능하면** react-router, react-dnd, @mui/material, @emotion/*, recharts 등 미사용 의존성 제거를 제공한다.

**[REQ-OPT-002] Optional - Server Components 활용**
**가능하면** 상태를 사용하지 않는 순수 표시 컴포넌트를 Server Component로 유지하여 번들 크기를 최적화한다.

---

## 4. Specifications (명세)

### 4.1 삭제 대상 파일

| 파일 | 사유 |
|------|------|
| vite.config.ts | Vite 빌드 설정 (Next.js로 대체) |
| index.html | Vite SPA 진입점 (App Router로 대체) |
| src/main.tsx | React createRoot 진입점 (App Router로 대체) |
| postcss.config.mjs | 기존 PostCSS 설정 (postcss.config.cjs로 대체) |

### 4.2 생성 대상 파일

| 파일 | 역할 |
|------|------|
| app/layout.tsx | 루트 레이아웃 (HTML, 폰트, ThemeProvider, 글로벌 CSS) |
| app/page.tsx | 메인 페이지 (기존 App.tsx 내용 이동) |
| next.config.mjs | Next.js 설정 |
| postcss.config.cjs | PostCSS + @tailwindcss/postcss 설정 |

### 4.3 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| package.json | next 추가, vite/@vitejs/plugin-react/@tailwindcss/vite 제거, scripts 변경 |
| tsconfig.json | paths 설정 업데이트 (@ -> ./src) |
| 비즈니스 컴포넌트 8개 | "use client" 디렉티브 추가 |

### 4.4 use client 대상 컴포넌트

| 컴포넌트 | 경로 | 사유 |
|----------|------|------|
| App.tsx | src/app/App.tsx | useState 대량 사용 |
| ConfigurationPanel.tsx | src/app/components/ | 상태 관리 + 이벤트 핸들러 |
| FileUploadSection.tsx | src/app/components/ | 파일 업로드 + 드래그 이벤트 |
| InputDataSection.tsx | src/app/components/ | 동적 필드 관리 상태 |
| OutputDataSection.tsx | src/app/components/ | 탭 전환 상태 |
| SchemaSection.tsx | src/app/components/ | JSON 편집 상태 |
| SystemPromptSection.tsx | src/app/components/ | 텍스트 입력 상태 |
| UserPromptSection.tsx | src/app/components/ | 텍스트 입력 상태 |

### 4.5 의존성 변경 사항

**추가:**
- `next` (latest stable)
- `@tailwindcss/postcss` (4.x)

**제거:**
- `vite` (6.3.5)
- `@vitejs/plugin-react` (4.7.0)
- `@tailwindcss/vite` (4.1.12)

**scripts 변경:**
- `dev`: `vite` -> `next dev`
- `build`: `vite build` -> `next build`
- `start`: 추가 `next start`

---

## 5. Traceability (추적성)

| 요구사항 ID | Plan 참조 | Acceptance 참조 |
|------------|-----------|----------------|
| REQ-BUILD-001~004 | Phase 1 | AC-PHASE1-* |
| REQ-APPROUTER-001~003 | Phase 1 | AC-PHASE1-* |
| REQ-CLIENT-001~003 | Phase 2 | AC-PHASE2-* |
| REQ-THEME-001~002 | Phase 2 | AC-PHASE2-* |
| REQ-OPT-001~002 | Phase 3 | AC-PHASE3-* |
