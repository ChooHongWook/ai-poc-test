---
name: moai-domain-frontend
description: >
  React 19, Next.js 16, Vue 3.5 및 최신 UI/UX 패턴과 컴포넌트 아키텍처를 포괄하는
  프론트엔드 개발 전문 스킬. 웹 UI 구축, 컴포넌트 구현, 프론트엔드 성능 최적화,
  상태 관리 통합 시 사용합니다.
license: Apache-2.0
compatibility: Claude Code용으로 설계됨
allowed-tools: Read Grep Glob mcp__context7__resolve-library-id mcp__context7__get-library-docs
user-invocable: false
metadata:
  version: "2.0.0"
  category: "domain"
  status: "active"
  updated: "2026-01-11"
  modularized: "true"
  tags: "frontend, react, nextjs, vue, ui, components"
  author: "MoAI-ADK Team"
  context7-libraries: "/facebook/react, /vercel/next.js, /vuejs/vue"

# MoAI Extension: Triggers
triggers:
  keywords: ["frontend", "UI", "component", "React", "Next.js", "Vue", "user interface", "responsive", "TypeScript", "JavaScript", "state management", "hooks", "props", "JSX", "TSX", "client-side", "browser", "DOM", "CSS", "Tailwind"]
---

# 프론트엔드 개발 전문 스킬

## 빠른 참조

최신 프론트엔드 개발 - React 19, Next.js 16, Vue 3.5를 위한 종합 패턴.

핵심 역량:

- React 19: 서버 컴포넌트, 동시성 기능, cache(), Suspense
- Next.js 16: App Router, Server Actions, ISR, Route handlers
- Vue 3.5: Composition API, TypeScript, Pinia 상태 관리
- 컴포넌트 아키텍처: 디자인 시스템, 복합 컴포넌트, CVA
- 성능: 코드 분할, 동적 임포트, 메모이제이션

사용 시기:

- 최신 웹 애플리케이션 개발
- 컴포넌트 라이브러리 생성
- 프론트엔드 성능 최적화
- 접근성을 고려한 UI/UX

---

## 모듈 인덱스

상세 패턴은 특정 모듈을 로드하세요:

### 프레임워크 패턴

React 19 패턴 (modules/react19-patterns.md):

- 서버 컴포넌트, 동시성 기능, cache() API, 폼 처리

Next.js 16 패턴 (modules/nextjs16-patterns.md):

- App Router, Server Actions, ISR, Route Handlers, Parallel Routes

Vue 3.5 패턴 (modules/vue35-patterns.md):

- Composition API, Composables, 반응성, Pinia, Provide/Inject

### 아키텍처 패턴

컴포넌트 아키텍처 (modules/component-architecture.md):

- 디자인 토큰, CVA 배리언트, 복합 컴포넌트, 접근성

상태 관리 (modules/state-management.md):

- Zustand, Redux Toolkit, React Context, Pinia

성능 최적화 (modules/performance-optimization.md):

- 코드 분할, 동적 임포트, 이미지 최적화, 메모이제이션

Vercel React 모범 사례 (modules/vercel-react-best-practices.md):

- 8개 카테고리에 걸친 45가지 규칙 (Vercel Engineering 제공)
- 워터폴 제거, 번들 최적화, 서버 사이드 성능
- 클라이언트 사이드 데이터 페칭, 리렌더 최적화, 렌더링 성능

---

## 구현 퀵스타트

### React 19 서버 컴포넌트

React의 cache 함수를 사용하여 데이터 페칭을 메모이제이션하는 비동기 페이지 컴포넌트를 생성합니다. 로딩 상태를 위해 Suspense를 임포트합니다. id 파라미터로 API 엔드포인트에서 데이터를 가져와 JSON을 반환하는 getData 함수를 정의합니다. 페이지 컴포넌트에서 Skeleton 폴백과 함께 Suspense로 DataDisplay 컴포넌트를 감싸고, await된 getData 결과를 data prop으로 전달합니다.

### Next.js Server Action

use server 지시문이 있는 서버 액션 파일을 생성합니다. next/cache에서 revalidatePath를, 유효성 검사를 위해 zod에서 z를 임포트합니다. title(최소 1자)과 content(최소 10자)로 스키마를 정의합니다. createPost 함수는 FormData를 받아 safeParse로 유효성을 검사하고, 실패 시 에러를 반환하며, 데이터베이스에 게시물을 생성하고, posts 페이지에 대해 revalidatePath를 호출합니다.

### Vue Composable

userId ref 파라미터를 받는 useUser composable을 생성합니다. user를 nullable ref로, loading을 boolean ref로, fullName을 firstName과 lastName을 연결하는 computed 속성으로 정의합니다. watchEffect를 사용하여 loading을 true로 설정하고, 비동기적으로 사용자 데이터를 가져와 user ref에 할당한 후 loading을 false로 설정합니다. user, loading, fullName ref를 반환합니다.

### CVA 컴포넌트

class-variance-authority에서 cva와 VariantProps를 임포트합니다. inline-flex, items-center, justify-center, rounded-md, font-medium의 기본 클래스로 buttonVariants를 정의합니다. default(호버가 있는 primary 배경)와 outline(호버 accent가 있는 border)의 variant 옵션이 포함된 variants 객체를 추가합니다. sm(h-9, px-3, text-sm), default(h-10, px-4), lg(h-11, px-8)의 size 옵션을 추가합니다. variant와 size의 defaultVariants를 설정합니다. 버튼 요소의 className에 배리언트를 적용하는 Button 컴포넌트를 내보냅니다.

---

## 함께 사용하기 좋은 스킬

- moai-domain-backend - 풀스택 개발
- moai-library-shadcn - 컴포넌트 라이브러리 통합
- moai-domain-uiux - UI/UX 디자인 원칙
- moai-lang-typescript - TypeScript 패턴
- moai-workflow-testing - 프론트엔드 테스팅

---

## 기술 스택

프레임워크: React 19, Next.js 16, Vue 3.5, Nuxt 3

언어: TypeScript 5.9+, JavaScript ES2024

스타일링: Tailwind CSS 3.4+, CSS Modules, shadcn/ui

상태 관리: Zustand, Redux Toolkit, Pinia

테스팅: Vitest, Testing Library, Playwright

---

## 리소스

modules 디렉토리의 모듈 파일에 상세 패턴이 포함되어 있습니다.

동작하는 코드 예제는 [examples.md](examples.md)를 참조하세요.

공식 문서:

- React: https://react.dev/
- Next.js: https://nextjs.org/docs
- Vue: https://vuejs.org/

---

버전: 2.0.0
최종 업데이트: 2026-01-11
