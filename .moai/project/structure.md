# 프로젝트 구조

## 디렉토리 레이아웃

```
v2_ai-poc-test/
├── next.config.ts                # Next.js 설정
├── package.json                  # 의존성 (pnpm)
├── tsconfig.json                 # TypeScript strict mode
├── postcss.config.mjs            # PostCSS 설정
├── app/
│   ├── layout.tsx                # 루트 레이아웃 (ThemeProvider, Header, Footer, MSWProvider)
│   ├── globals.css               # 통합 글로벌 스타일
│   ├── page.tsx                  # / 메인 페이지 (문서 생성)
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # POST /api/generate Route Handler
│   ├── history/
│   │   └── page.tsx              # /history 생성 이력
│   ├── settings/
│   │   └── page.tsx              # /settings AI 제공자 설정
│   └── (main)/
│       └── _components/          # 메인 페이지 전용 컴포넌트
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
│   ├── ui/                       # shadcn/ui 컴포넌트 (48개)
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── providers/
│   │   └── MSWProvider.tsx       # MSW 초기화 Provider
│   └── common/
│       └── ImageWithFallback.tsx
├── lib/
│   ├── utils.ts                  # cn() 유틸리티
│   ├── types.ts                  # 공유 타입 (AIOutput, HistoryItem)
│   ├── api/
│   │   ├── generate.ts           # fetch 기반 API 클라이언트
│   │   └── __tests__/
│   │       └── generate.test.ts   # API 클라이언트 테스트
│   ├── mock/
│   │   ├── generate.ts           # Mock AI 생성 로직
│   │   ├── handlers.ts           # MSW request handler
│   │   ├── browser.ts            # MSW browser worker
│   │   ├── node.ts               # MSW node server
│   │   ├── index.ts              # MSW 초기화 진입점
│   │   └── __tests__/
│   │       └── handlers.test.ts   # 핸들러 테스트
│   └── providers/
│       ├── ai-config-provider.tsx
│       └── history-provider.tsx
├── hooks/
│   └── use-mobile.ts             # 모바일 감지 훅
├── public/
│   └── mockServiceWorker.js      # MSW 서비스 워커
├── vitest.config.ts              # Vitest 설정
├── .moai/                        # MoAI orchestrator 설정
└── .claude/                      # Claude Code 규칙 & 스킬
```

## 아키텍처

```
Next.js App Router (멀티페이지)
├── 진입점: app/layout.tsx (서버) -> app/page.tsx (클라이언트)
├── 상태: React Context + localStorage + 페이지별 useState
├── 레이아웃: 공유 Header/Footer via layout.tsx, 메인 페이지 2컬럼 그리드
├── 라우팅: Next.js App Router (/, /history, /settings)
└── 스타일링: Tailwind CSS v4 + CSS 변수 (OKLch)
```

## 컴포넌트 계층 구조

```
layout.tsx (루트 레이아웃, 서버)
├── Header (클라이언트)
├── Main page-specific layout
└── Footer (클라이언트)

page.tsx (메인 페이지, 클라이언트)
├── ConfigurationPanel
│   └── AIProviderConfigItem (x3)
├── SystemPromptSection
├── UserPromptSection
├── SchemaSection
├── InputDataSection
├── FileUploadSection
└── OutputDataSection
    └── AIOutputPreview (제공자별)

history/page.tsx (이력 페이지)
settings/page.tsx (설정 페이지)
```
