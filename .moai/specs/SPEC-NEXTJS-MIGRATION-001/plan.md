# SPEC-NEXTJS-MIGRATION-001: 구현 계획

## 추적성 태그
- SPEC-NEXTJS-MIGRATION-001-R1 ~ R5

---

## 마일스톤 개요

| 마일스톤 | Phase | 우선순위 | 영향 범위 |
|---------|-------|---------|----------|
| M1: Next.js 프로젝트 초기화 | Phase 1 | Primary Goal | 설정 파일, 디렉토리 구조 |
| M2: MUI 제거 | Phase 2 | Primary Goal | 컴포넌트 파일, 의존성 |
| M3: 레이아웃 및 라우팅 | Phase 3 | Primary Goal | App Router, 레이아웃, 상태 관리 |
| M4: 컴포넌트 마이그레이션 | Phase 4 | Secondary Goal | 전체 컴포넌트, 스타일 |
| M5: 정리 및 검증 | Phase 5 | Final Goal | 의존성, 빌드 검증 |

---

## M1: Next.js 프로젝트 초기화 (Phase 1)

### 목표
기존 프로젝트 내에서 Next.js App Router 구조를 설정한다.

### 기술 접근

1. **Next.js 설치 및 설정**
   - `pnpm add next` 실행
   - `next.config.ts` 생성
   - `tsconfig.json`을 Next.js 호환 형태로 업데이트
   - `package.json` scripts 수정 (`dev`, `build`, `start`)

2. **Tailwind CSS 4 for Next.js 설정**
   - `@tailwindcss/postcss` 플러그인으로 전환 (Vite 플러그인 대신)
   - `postcss.config.mjs` 업데이트
   - `app/globals.css`에 `@import "tailwindcss"` 설정

3. **경로 별칭 설정**
   - `tsconfig.json`에 `@/*` 경로 별칭 유지/설정
   - Next.js 기본 경로 해석과 호환 확인

4. **App Router 기본 구조 생성**
   - `app/layout.tsx` (루트 레이아웃)
   - `app/page.tsx` (임시 메인 페이지)
   - `app/globals.css` (스타일 통합)

### 산출물
- `next.config.ts`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- 업데이트된 `tsconfig.json`, `package.json`, `postcss.config.mjs`

### 검증 기준
- `pnpm dev`로 Next.js 개발 서버 정상 기동
- 기본 페이지 렌더링 확인
- Tailwind CSS 클래스 정상 적용 확인

---

## M2: MUI 제거 (Phase 2)

### 목표
MUI 및 Emotion 의존성을 완전히 제거하고 shadcn/ui로 통합한다.

### 기술 접근

1. **MUI 사용처 스캔**
   - `@mui/material`, `@mui/icons-material` import를 포함한 모든 파일 탐색
   - 각 MUI 컴포넌트의 사용 패턴과 props 기록

2. **컴포넌트 교체**
   - MUI 컴포넌트 -> shadcn/ui 동등 컴포넌트로 교체
   - MUI 아이콘 -> lucide-react 아이콘으로 교체
   - MUI 고유 props를 shadcn/ui 패턴으로 변환

3. **의존성 제거**
   - `pnpm remove @mui/material @mui/icons-material @emotion/react @emotion/styled`
   - 빌드 오류 확인 및 누락 교체 처리

### 리스크
- MUI 고유 기능(예: 복잡한 Select, Autocomplete)이 shadcn/ui에 없을 수 있음
- 대응: 필요시 shadcn/ui 컴포넌트를 확장하거나 Radix UI 원시 컴포넌트 활용

### 검증 기준
- `@mui/*`, `@emotion/*` import가 프로젝트에서 완전히 제거됨
- 모든 UI 요소가 shadcn/ui 기반으로 정상 렌더링
- 기존과 동등한 UI/UX 제공

---

## M3: 레이아웃 및 라우팅 마이그레이션 (Phase 3)

### 목표
단일 페이지 구조를 Next.js App Router 기반 멀티페이지로 전환한다.

### 기술 접근

1. **루트 레이아웃 구현** (`app/layout.tsx`)
   - HTML 구조, ThemeProvider, 메타데이터 설정
   - 공통 Header/Footer 컴포넌트 추출
   - `next-themes`의 `ThemeProvider` 통합

2. **페이지 라우트 생성**
   - `app/page.tsx`: 메인 문서 생성 인터페이스
   - `app/history/page.tsx`: 생성 이력 목록
   - `app/settings/page.tsx`: AI 제공자 설정

3. **네비게이션 구현**
   - Header에 `next/link` 기반 내비게이션 추가
   - 현재 활성 경로 표시

4. **상태 관리 분산**
   - App.tsx의 모든 useState를 분석하여 페이지별로 분산
   - 페이지 간 공유 상태가 필요한 경우 React Context 또는 경량 상태 라이브러리 검토
   - AI 제공자 설정은 `/settings`에서 관리, 메인 페이지에서 참조

### 리스크
- 상태 분산 시 기존 기능이 깨질 수 있음
- 대응: 단계적으로 한 페이지씩 분리하며 기능 검증

### 검증 기준
- 세 개 라우트(`/`, `/history`, `/settings`) 모두 정상 접근 가능
- 페이지 간 네비게이션 정상 동작
- 공통 레이아웃(헤더, 푸터) 모든 페이지에서 일관 유지

---

## M4: 컴포넌트 마이그레이션 (Phase 4)

### 목표
기존 컴포넌트를 Next.js 구조에 맞게 재배치하고 호환성을 확보한다.

### 기술 접근

1. **shadcn/ui 컴포넌트 이동**
   - `src/app/components/ui/*` -> `components/ui/*`
   - 경로 별칭 업데이트

2. **기능 컴포넌트 분류 및 이동**
   - 메인 페이지 전용: `app/(main)/_components/` 또는 적절한 위치
   - 공통 컴포넌트: `components/common/`
   - 레이아웃 컴포넌트: `components/layout/`

3. **'use client' 지시어 추가**
   - useState, useEffect, 이벤트 핸들러를 사용하는 컴포넌트에 `'use client'` 추가
   - shadcn/ui 컴포넌트는 이미 클라이언트 컴포넌트로 동작

4. **스타일 마이그레이션**
   - `src/styles/` 하위 4개 파일을 `app/globals.css`로 통합
   - CSS 변수, 폰트, Tailwind 설정 병합
   - OKLch 색상 모델, 다크모드 클래스 토글 유지

5. **유틸리티 및 훅 이동**
   - `utils.ts` -> `lib/utils.ts`
   - `use-mobile.ts` -> `hooks/use-mobile.ts`
   - Mock 로직 -> `lib/mock/`

### 리스크
- import 경로 변경으로 인한 대량 수정 필요
- 대응: 경로 별칭(`@/`)을 활용하여 영향 최소화

### 검증 기준
- 모든 컴포넌트가 새 경로에서 정상 렌더링
- 다크모드, 반응형 레이아웃 정상 동작
- 이전과 동일한 UI/UX 제공

---

## M5: 정리 및 검증 (Phase 5)

### 목표
불필요한 의존성과 파일을 제거하고 최종 빌드 검증을 수행한다.

### 기술 접근

1. **Vite 관련 파일/의존성 제거**
   - `vite.config.ts` 삭제
   - `index.html` 삭제 (Next.js가 자동 생성)
   - `pnpm remove vite @vitejs/plugin-react @tailwindcss/vite`

2. **미사용 의존성 제거**
   - `pnpm remove react-router react-router-dom`
   - 기타 사용되지 않는 패키지 식별 및 제거

3. **빌드 검증**
   - `pnpm build`: 프로덕션 빌드 성공 확인
   - `pnpm dev`: 개발 서버 정상 기동 확인
   - TypeScript 타입 오류 없음 확인

4. **기능 회귀 테스트** (수동)
   - AI 제공자 설정 기능
   - 프롬프트 입력 기능
   - 스키마/입력 데이터 관리
   - 문서 생성 (Mock) 기능
   - 출력 탭 전환 기능
   - 다크모드 토글
   - 반응형 레이아웃

### 검증 기준
- `pnpm build` 오류 없이 성공
- `pnpm dev` 정상 기동
- TypeScript 타입 오류 0건
- 기존 SPA의 모든 기능이 동등하게 동작

---

## 아키텍처 설계 방향

### 서버 컴포넌트 vs 클라이언트 컴포넌트 전략

이 애플리케이션은 대부분 인터랙티브 UI(폼, 상태, 이벤트)로 구성되어 있으므로, 대다수 컴포넌트가 클라이언트 컴포넌트(`'use client'`)로 동작한다. 서버 컴포넌트의 이점은 향후 실제 API 연동 시 점진적으로 활용할 수 있다.

- **서버 컴포넌트**: `app/layout.tsx`, 정적 페이지 셸
- **클라이언트 컴포넌트**: 폼, 설정, 출력 등 인터랙티브 UI 전체

### Mock API 유지 전략

현재 Mock 로직을 `lib/mock/` 디렉토리로 분리하여, 향후 실제 API로 교체 시 인터페이스만 변경하면 되도록 설계한다.

---

## 리스크 및 대응 계획

| 리스크 | 영향 | 대응 |
|-------|------|------|
| Tailwind CSS 4 + Next.js 호환 문제 | 스타일 깨짐 | 공식 문서 확인, PostCSS 설정 조정 |
| MUI 고유 기능 대체 불가 | 기능 손실 | Radix UI 원시 컴포넌트로 커스텀 구현 |
| 상태 분산 시 기존 기능 깨짐 | 기능 회귀 | 단계적 분리, 페이지별 수동 테스트 |
| Import 경로 대량 변경 | 빌드 실패 | 경로 별칭 활용, IDE refactor 지원 |
| next-themes + App Router 설정 충돌 | 테마 오작동 | suppressHydrationWarning 활용 |
