# Research: Vite → Next.js 마이그레이션

## 1. 현재 아키텍처

- **빌드 도구**: Vite 6.3.5 + @vitejs/plugin-react
- **프레임워크**: React 18.3.1 SPA
- **진입점**: index.html → src/main.tsx → src/app/App.tsx
- **스타일링**: Tailwind CSS v4 (@tailwindcss/vite)
- **UI**: Radix UI (50+ 컴포넌트) + shadcn/ui 패턴
- **경로 별칭**: @ → ./src (vite.config.ts)
- **상태 관리**: useState 기반 로컬 상태 (App.tsx에 집중)
- **라우팅**: React Router v7 설치됨, 미사용 (단일 페이지)

## 2. 의존성 호환성 분석

### Next.js 호환 (변경 불필요)
- Radix UI 전체 (40+ 컴포넌트)
- React Hook Form 7.55.0
- lucide-react 0.487.0
- motion 12.23.24
- clsx, tailwind-merge, class-variance-authority
- date-fns, recharts, sonner
- next-themes 0.4.6 (이미 설치됨)

### Vite 전용 (제거 필요)
- vite 6.3.5
- @vitejs/plugin-react 4.7.0
- @tailwindcss/vite 4.1.12 → @tailwindcss/postcss로 교체

### 미사용 의존성 (선택적 정리)
- react-router 7.13.0, react-dnd 16.0.1
- @mui/material, @mui/icons-material, @emotion/*
- recharts, react-responsive-masonry, react-slick, canvas-confetti

## 3. 마이그레이션 위험 분석

### 저위험
- Radix UI 컴포넌트: 100% 호환
- Tailwind CSS: postcss 플러그인 교체만 필요
- CSS 변수 테마 시스템 (theme.css): 변경 불필요
- 아이콘, 애니메이션, 유틸리티: 모두 호환

### 중위험
- "use client" 디렉티브: 비즈니스 컴포넌트 8개에 추가 필요
- next-themes ThemeProvider: 현재 미구현, layout.tsx에 래핑 필요
- sonner.tsx만 "use client" 보유

### 확인 필요
- HMR 동작 차이 (Vite vs Next.js)
- 파일 업로드 드래그 & 드롭 동작
- 포트 변경: 5173 → 3000

## 4. 핵심 변경 파일

### 삭제 대상
- vite.config.ts, postcss.config.mjs, index.html, src/main.tsx

### 생성 대상
- app/layout.tsx (루트 레이아웃 + ThemeProvider)
- app/page.tsx (App.tsx 이동)
- next.config.mjs
- postcss.config.cjs

### 수정 대상
- package.json (의존성 교체)
- tsconfig.json (경로 별칭)
- 비즈니스 컴포넌트 8개 ("use client" 추가)

## 5. 권장 마이그레이션 단계

### Phase 1: 최소 Next.js 설정
- Next.js 설치, Vite 제거
- 설정 파일 교체
- app/layout.tsx + page.tsx 생성

### Phase 2: 컴포넌트 마이그레이션
- "use client" 디렉티브 추가
- ThemeProvider 구현
- 컴포넌트 동작 검증

### Phase 3: 최적화 (선택)
- 미사용 의존성 정리
- Server Components 활용
- Next.js Image 컴포넌트 적용
