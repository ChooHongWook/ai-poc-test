# 프론트엔드 개발 스페셜리스트

## 빠른 참조

최신 프론트엔드 개발 - React 19, Next.js 16, Vue 3.5를 위한 종합 패턴.

핵심 역량:

- React 19: 서버 컴포넌트, 동시성 기능, cache(), Suspense
- Next.js 16: App Router, 서버 액션, ISR, 라우트 핸들러
- Vue 3.5: Composition API, TypeScript, Pinia 상태 관리
- 컴포넌트 아키텍처: 디자인 시스템, 복합 컴포넌트, CVA
- 성능: 코드 스플리팅, 동적 임포트, 메모이제이션

사용 시점:

- 최신 웹 애플리케이션 개발
- 컴포넌트 라이브러리 생성
- 프론트엔드 성능 최적화
- 접근성을 고려한 UI/UX

---

## 모듈 인덱스

상세 패턴은 특정 모듈을 로드하세요:

### 프레임워크 패턴

modules/react19-patterns.md의 React 19 패턴:

- 서버 컴포넌트, 동시성 기능, cache() API, 폼 처리

modules/nextjs16-patterns.md의 Next.js 16 패턴:

- App Router, 서버 액션, ISR, 라우트 핸들러, 병렬 라우트

modules/vue35-patterns.md의 Vue 3.5 패턴:

- Composition API, 컴포저블, 반응성, Pinia, Provide/Inject

### 아키텍처 패턴

modules/component-architecture.md의 컴포넌트 아키텍처:

- 디자인 토큰, CVA 변형, 복합 컴포넌트, 접근성

modules/state-management.md의 상태 관리:

- Zustand, Redux Toolkit, React Context, Pinia

modules/performance-optimization.md의 성능 최적화:

- 코드 스플리팅, 동적 임포트, 이미지 최적화, 메모이제이션

modules/vercel-react-best-practices.md의 Vercel React 모범 사례:

- Vercel 엔지니어링의 8개 카테고리에 걸친 45가지 규칙
- 워터폴 제거, 번들 최적화, 서버 사이드 성능
- 클라이언트 사이드 데이터 페칭, 리렌더링 최적화, 렌더링 성능

---

## 구현 빠른 시작

### React 19 서버 컴포넌트

React의 cache 함수를 사용하여 데이터 페칭을 메모이제이션하는 비동기 페이지 컴포넌트를 생성합니다. 로딩 상태를 위해 Suspense를 임포트합니다. id 매개변수로 API 엔드포인트에서 페칭하여 JSON을 반환하는 getData 함수를 정의합니다. 페이지 컴포넌트에서 Skeleton 폴백을 사용하는 Suspense로 DataDisplay 컴포넌트를 감싸고, await된 getData 결과를 data prop으로 전달합니다.

### Next.js 서버 액션

use server 지시어가 있는 서버 액션 파일을 생성합니다. next/cache에서 revalidatePath를, zod에서 유효성 검사를 위한 z를 임포트합니다. title(최소 1자)과 content(최소 10자)를 포함하는 스키마를 정의합니다. createPost 함수는 FormData를 받아 safeParse로 유효성을 검사하고, 실패 시 오류를 반환하며, 데이터베이스에 게시물을 생성하고, posts 페이지에 대해 revalidatePath를 호출합니다.

### Vue 컴포저블

userId ref 매개변수를 받는 useUser 컴포저블을 생성합니다. user를 nullable ref로, loading을 boolean ref로, fullName을 firstName과 lastName을 연결하는 computed 속성으로 정의합니다. watchEffect를 사용하여 loading을 true로 설정하고, 비동기적으로 사용자 데이터를 페칭하여 user ref에 할당하고, loading을 false로 설정합니다. user, loading, fullName ref를 반환합니다.

### CVA 컴포넌트

class-variance-authority에서 cva와 VariantProps를 임포트합니다. inline-flex, items-center, justify-center, rounded-md, font-medium의 기본 클래스로 buttonVariants를 정의합니다. default(호버가 있는 primary 배경)와 outline(호버 accent가 있는 border) 옵션의 variant를 포함하는 variants 객체를 추가합니다. sm(h-9, px-3, text-sm), default(h-10, px-4), lg(h-11, px-8)의 size 옵션을 추가합니다. variant와 size에 대한 defaultVariants를 설정합니다. 변형을 button 요소의 className에 적용하는 Button 컴포넌트를 내보냅니다.

---

## 함께 사용하면 좋은 스킬

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

상태: Zustand, Redux Toolkit, Pinia

테스팅: Vitest, Testing Library, Playwright

---

## 리소스

모듈 디렉토리의 모듈 파일에 상세 패턴이 포함되어 있습니다.

실제 코드 예제는 [examples.md](examples.md)를 참조하세요.

공식 문서:

- React: https://react.dev/
- Next.js: https://nextjs.org/docs
- Vue: https://vuejs.org/

---

버전: 2.0.0
최종 업데이트: 2026-01-11
