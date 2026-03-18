# Project Structure

## 디렉토리 구조

```
ai_poc/
├── package.json                  # 의존성 및 스크립트
├── next.config.mjs               # Next.js 빌드 설정
├── postcss.config.cjs            # PostCSS + Tailwind 설정
├── tsconfig.json                 # TypeScript 설정 (@ 별칭 → ./src)
├── next-env.d.ts                 # Next.js 타입 정의
├── guidelines/                   # 프로젝트 가이드라인
├── app/
│   ├── layout.tsx                # 루트 레이아웃 (HTML, 폰트, ThemeProvider)
│   ├── page.tsx                  # 메인 페이지
│   ├── providers.tsx             # next-themes ThemeProvider
│   └── (components 폴더는 src/app/components로 이동)
├── src/
│   ├── app/
│   │   └── components/
│   │       ├── ConfigurationPanel.tsx    # AI 제공자 설정 패널 (use client)
│   │       ├── FileUploadSection.tsx     # 파일 업로드 (use client)
│   │       ├── InputDataSection.tsx      # 입력 데이터 관리 (use client)
│   │       ├── OutputDataSection.tsx     # AI 출력 결과 (use client)
│   │       ├── SchemaSection.tsx         # JSON 스키마 (use client)
│   │       ├── SystemPromptSection.tsx   # 시스템 프롬프트 (use client)
│   │       ├── UserPromptSection.tsx     # 유저 프롬프트 (use client)
│   │       ├── figma/
│   │       │   └── ImageWithFallback.tsx # 이미지 폴백 컴포넌트
│   │       └── ui/                      # Radix UI 래퍼 (50+ 컴포넌트)
│   └── styles/
│       ├── fonts.css             # 커스텀 폰트
│       ├── globals.css           # 글로벌 스타일 (layout.tsx에서 임포트)
│       ├── tailwind.css          # Tailwind 지시문
│       └── theme.css             # 테마 색상/변수
├── .claude/                      # Claude Code 설정
├── .moai/                        # MoAI 워크플로우 설정
└── node_modules/                 # 의존성 (11MB)
```

## 아키텍처 패턴

### 빌드 시스템
- **Next.js 15.3.3** App Router SPA (Single Page Application)
- 경로 별칭: `@` → `./src` (tsconfig.json)

### 컴포넌트 구조
- **React 함수형 컴포넌트** (클래스 컴포넌트 없음)
- **Radix UI** 기반 컴포넌트 라이브러리 (`src/app/components/ui/`)
- 비즈니스 컴포넌트는 `src/app/components/` 직하에 배치

### 상태 관리
- React `useState` 훅 기반 로컬 상태
- 전역 상태 관리 라이브러리 없음 (App.tsx에서 최상위 상태 관리)

### 스타일링
- **Tailwind CSS v4.1.12** with @tailwindcss/postcss (유틸리티 우선)
- **class-variance-authority** (CVA) + **clsx** + **tailwind-merge** 조합
- CSS 변수 기반 테마 시스템 (`theme.css`)
- **next-themes ThemeProvider** 활성화 (라이트/다크 모드)

### 라우팅
- **Next.js App Router** (자동 파일 기반 라우팅)
- 현재 단일 페이지 구조 (app/page.tsx가 메인)

## 파일 수 요약
- 비즈니스 컴포넌트: 8개
- UI 컴포넌트: 50+개
- 스타일 파일: 4개
- 설정 파일: 3개 (vite, postcss, package.json)
