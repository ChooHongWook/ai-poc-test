# Project Structure

## 디렉토리 구조

```
ai_poc/
├── index.html                    # Vite 진입점 HTML
├── package.json                  # 의존성 및 스크립트
├── vite.config.ts                # Vite 빌드 설정 (@ 별칭 → ./src)
├── postcss.config.mjs            # PostCSS 설정
├── guidelines/                   # 프로젝트 가이드라인
├── src/
│   ├── main.tsx                  # React 앱 진입점 (createRoot)
│   ├── app/
│   │   ├── App.tsx               # 메인 앱 컴포넌트 (242줄)
│   │   └── components/
│   │       ├── ConfigurationPanel.tsx    # AI 제공자 설정 패널 (204줄)
│   │       ├── FileUploadSection.tsx     # 파일 업로드 (158줄)
│   │       ├── InputDataSection.tsx      # 입력 데이터 관리 (116줄)
│   │       ├── OutputDataSection.tsx     # AI 출력 결과 (157줄)
│   │       ├── SchemaSection.tsx         # JSON 스키마 (56줄)
│   │       ├── SystemPromptSection.tsx   # 시스템 프롬프트 (35줄)
│   │       ├── UserPromptSection.tsx     # 유저 프롬프트 (35줄)
│   │       ├── figma/
│   │       │   └── ImageWithFallback.tsx # 이미지 폴백 컴포넌트
│   │       └── ui/                      # Radix UI 래퍼 (50+ 컴포넌트)
│   └── styles/
│       ├── fonts.css             # 커스텀 폰트
│       ├── index.css             # 기본 스타일 임포트
│       ├── tailwind.css          # Tailwind 지시문
│       └── theme.css             # 테마 색상/변수
├── .claude/                      # Claude Code 설정
├── .moai/                        # MoAI 워크플로우 설정
└── node_modules/                 # 의존성 (11MB)
```

## 아키텍처 패턴

### 빌드 시스템
- **Vite** 기반 SPA (Single Page Application)
- 경로 별칭: `@` → `./src`

### 컴포넌트 구조
- **React 함수형 컴포넌트** (클래스 컴포넌트 없음)
- **Radix UI** 기반 컴포넌트 라이브러리 (`src/app/components/ui/`)
- 비즈니스 컴포넌트는 `src/app/components/` 직하에 배치

### 상태 관리
- React `useState` 훅 기반 로컬 상태
- 전역 상태 관리 라이브러리 없음 (App.tsx에서 최상위 상태 관리)

### 스타일링
- **Tailwind CSS v4** (유틸리티 우선)
- **class-variance-authority** (CVA) + **clsx** + **tailwind-merge** 조합
- CSS 변수 기반 테마 시스템 (`theme.css`)

### 라우팅
- **React Router v7** 포함되어 있으나 현재 단일 페이지

## 파일 수 요약
- 비즈니스 컴포넌트: 8개
- UI 컴포넌트: 50+개
- 스타일 파일: 4개
- 설정 파일: 3개 (vite, postcss, package.json)
