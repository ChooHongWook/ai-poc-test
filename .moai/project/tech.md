# 기술 스택

## 런타임 & 빌드

| 항목 | 기술 | 버전 |
|------|------|------|
| 빌드 도구 | Next.js | 16.2.1 |
| 프레임워크 | Next.js App Router | - |
| 언어 | TypeScript | 5.9.3 |
| 런타임 | React | 19.2.4 |
| 패키지 매니저 | pnpm | - |

## UI 프레임워크

| 항목 | 기술 | 버전 |
|------|------|------|
| CSS | Tailwind CSS | 4.1.12 |
| 스타일링 엔진 | @tailwindcss/postcss | 4.2.2 |
| 컴포넌트 라이브러리 | shadcn/ui (Radix UI) | Latest |
| 아이콘 | lucide-react | 0.487.0 |
| 토스트 | sonner | 2.0.3 |
| 차트 | recharts | 2.15.2 |

## 라이브러리

| 항목 | 기술 | 버전 |
|------|------|------|
| 폼 | react-hook-form | 7.55.0 |
| 드래그앤드롭 | react-dnd | 16.0.1 |
| 애니메이션 | motion | 12.23.24 |
| 날짜 | date-fns | 3.6.0 |
| 테마 | next-themes | 0.4.6 |
| 클래스 병합 | clsx + tailwind-merge | Latest |
| CVA | class-variance-authority | 0.7.1 |

## 개발 도구

| 항목 | 기술 | 버전 |
|------|------|------|
| 포매팅 | Prettier + prettier-plugin-tailwindcss | - |
| 타입 체크 | TypeScript strict mode | - |
| 테스트 프레임워크 | Vitest | ^4.1.0 |
| 테스트 환경 | jsdom | ^26.1.0 |
| 테스트 React | @vitejs/plugin-react | ^4.5.2 |
| API Mocking | MSW (Mock Service Worker) | ^2.8.4 |
| Next.js 설정 | next.config.ts | - |

## 주요 패턴

- **상태 관리**: React Context + localStorage (전역 상태) + useState (페이지 로컬 상태)
- **스타일링**: Tailwind 유틸리티 우선 + CSS 변수 (OKLch 색상 모델)
- **컴포넌트 아키텍처**: shadcn/ui 패턴 (복사-붙여넣기 컴포넌트) + Next.js App Router 컨벤션
- **다크모드**: next-themes에서 class 속성 전략
- **API**: MSW 기반 fetch API 아키텍처 (개발: MSW 인터셉트, 프로덕션: Route Handler 폴백, 실제 AI API 연동은 향후 작업)
- **라우팅**: Next.js App Router (/, /history, /settings)
- **SSR 전략**: 대부분 클라이언트 컴포넌트 ('use client'), 레이아웃 셸용 서버 컴포넌트
- **테스트**: Vitest + MSW node server

## 변경사항 요약

### 추가된 의존성
- next: 16.2.1 (App Router 프레임워크)
- @tailwindcss/postcss: 4.2.2 (Tailwind CSS 4 PostCSS 엔진)

### 제거된 의존성
- vite: 6.3.5 (빌드 도구)
- @vitejs/plugin-react (Vite React 플러그인)
- @tailwindcss/vite (Tailwind Vite 플러그인)
- @mui/material: 7.3.5 (MUI 컴포넌트 라이브러리)
- @mui/icons-material (MUI 아이콘)
- @emotion/react: 11.14.x (MUI 스타일 엔진)
- @emotion/styled (MUI 스타일 컴포넌트)
- react-router: 7.13.0 (미사용 라이브러리)

### 유지된 의존성
- React / React DOM: 19.2.4 (여전히 필수)
- typescript: 5.9.3
- tailwindcss: 4.1.12
- 모든 shadcn/ui 관련 (radix-ui/*, clsx, tailwind-merge, class-variance-authority)
- react-hook-form, lucide-react, sonner, recharts, motion, date-fns, react-dnd
- next-themes (Next.js 환경에서 기본 지원)
