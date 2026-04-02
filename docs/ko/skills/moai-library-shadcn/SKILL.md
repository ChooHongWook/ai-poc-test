---
name: moai-library-shadcn
description: >
  Tailwind CSS를 사용하는 React 애플리케이션을 위한 shadcn/ui 컴포넌트 라이브러리 전문 지식을 제공합니다.
  UI 컴포넌트, 디자인 시스템, 또는 shadcn/ui, Radix 프리미티브, Tailwind 기반 컴포넌트 라이브러리를 활용한
  컴포넌트 조합을 구현할 때 사용합니다.
  비-React 프레임워크나 순수 CSS 스타일링에는 사용하지 마세요
  (대신 moai-domain-frontend를 사용하세요).
license: Apache-2.0
compatibility: Claude Code 용으로 설계됨
allowed-tools: Read Grep Glob mcp__context7__resolve-library-id mcp__context7__get-library-docs
user-invocable: false
metadata:
  version: "2.1.0"
  category: "library"
  modularized: "true"
  status: "active"
  updated: "2026-01-11"
  tags: "library, shadcn, enterprise, development, ui"
  aliases: "moai-library-shadcn"

# MoAI Extension: Triggers
triggers:
  keywords: ["shadcn", "component library", "design system", "radix", "tailwind", "ui components"]
---

## 빠른 참조

엔터프라이즈 shadcn/ui 컴포넌트 라이브러리 전문가

AI 기반 디자인 시스템 아키텍처, Context7 통합, 지능형 컴포넌트 오케스트레이션을 갖춘 포괄적인 shadcn/ui 전문 지식으로 현대적인 React 애플리케이션을 지원합니다.

핵심 역량:

- Context7 MCP를 활용한 AI 기반 컴포넌트 아키텍처
- 자동화된 테마 커스터마이징을 갖춘 지능형 디자인 시스템
- 접근성과 성능을 갖춘 고급 컴포넌트 오케스트레이션
- 제로 구성 디자인 토큰을 갖춘 엔터프라이즈 UI 프레임워크
- 사용 인사이트를 갖춘 예측적 컴포넌트 분석

사용 시기:

- shadcn/ui 컴포넌트 라이브러리 관련 논의
- React 컴포넌트 아키텍처 계획
- Tailwind CSS 통합 및 디자인 토큰
- 접근성 구현
- 디자인 시스템 커스터마이징

모듈 구성:

- 핵심 개념: 이 파일에서 shadcn/ui 개요, 아키텍처, 에코시스템을 다룹니다
- 컴포넌트: shadcn-components.md 모듈에서 컴포넌트 라이브러리와 고급 패턴을 다룹니다
- 테마: shadcn-theming.md 모듈에서 테마 시스템과 커스터마이징을 다룹니다
- 고급 패턴: advanced-patterns.md 모듈에서 복잡한 구현을 다룹니다
- 최적화: optimization.md 모듈에서 성능 튜닝을 다룹니다

---

## 구현 가이드

### shadcn/ui 개요

shadcn/ui는 Radix UI와 Tailwind CSS로 구축된 재사용 가능한 컴포넌트 모음입니다. 기존 컴포넌트 라이브러리와 달리 npm 패키지가 아니라 프로젝트에 직접 복사하는 컴포넌트 모음입니다.

주요 장점으로는 컴포넌트에 대한 완전한 제어와 소유권, Radix UI 프리미티브 외 제로 의존성, Tailwind CSS를 통한 완전한 커스터마이징, 뛰어난 타입 안전성을 갖춘 TypeScript 우선 설계, WCAG 2.1 AA 준수를 갖춘 내장 접근성이 있습니다.

아키텍처 철학: shadcn/ui 컴포넌트는 스타일이 없는 접근 가능한 프리미티브를 제공하는 Radix UI Primitives 위에 구축됩니다. Tailwind CSS는 유틸리티 우선 스타일링을 제공합니다. TypeScript는 전체적으로 타입 안전성을 보장합니다. 사용자의 커스터마이징 레이어가 최종 구현에 대한 완전한 제어를 제공합니다.

### 핵심 컴포넌트 카테고리

폼 컴포넌트에는 Input, Select, Checkbox, Radio, Textarea가 포함됩니다. 폼 유효성 검사는 react-hook-form과 Zod와 통합됩니다. 적절한 ARIA 레이블을 통해 접근성이 보장됩니다.

디스플레이 컴포넌트에는 Card, Dialog, Sheet, Drawer, Popover가 포함됩니다. 반응형 디자인 패턴이 내장되어 있습니다. 다크 모드 지원이 포함되어 있습니다.

네비게이션 컴포넌트에는 Navigation Menu, Breadcrumb, Tabs, Pagination이 포함됩니다. 키보드 네비게이션 지원이 내장되어 있습니다. 포커스 관리가 자동으로 처리됩니다.

데이터 컴포넌트에는 Table, Calendar, DatePicker, Charts가 포함됩니다. 대규모 데이터셋을 위한 가상 스크롤링을 사용할 수 있습니다. TanStack Table 통합이 지원됩니다.

피드백 컴포넌트에는 Alert, Toast, Progress, Badge, Avatar가 포함됩니다. 로딩 상태와 스켈레톤을 사용할 수 있습니다. 에러 바운더리가 지원됩니다.

### 설치 및 설정

1단계: npx를 사용하여 최신 버전으로 shadcn-ui init 명령을 실행하여 shadcn/ui를 초기화합니다.

2단계: ui.shadcn.com/schema.json을 가리키는 스키마 URL로 components.json을 구성합니다. 스타일을 default로 설정하고 RSC와 TSX를 활성화합니다. 설정 경로, CSS 경로, 기본 색상, CSS 변수 활성화, 선택적 접두사를 포함한 Tailwind 설정을 구성합니다. 컴포넌트, utils, ui 경로에 대한 별칭을 설정합니다.

3단계: npx로 shadcn-ui add 명령을 사용하여 button, form, dialog 등의 컴포넌트 이름을 지정하여 개별 컴포넌트를 추가합니다.

### 기반 기술

React 19 기능에는 Server Components 지원, 동시 렌더링 기능, 자동 배치 개선, 스트리밍 SSR 향상이 포함됩니다.

TypeScript 5.5는 컴포넌트 전반에 걸친 완전한 타입 안전성, 제네릭에 대한 향상된 추론, 더 나은 에러 메시지, 향상된 개발자 경험을 제공합니다.

Tailwind CSS 3.4에는 JIT 컴파일, CSS 변수 지원, 다크 모드 변형, 컨테이너 쿼리가 포함됩니다.

Radix UI는 스타일이 없는 접근 가능한 프리미티브, 키보드 네비게이션, 포커스 관리, ARIA 속성을 제공합니다.

통합 스택에는 폼 상태 관리를 위한 React Hook Form, 스키마 유효성 검사를 위한 Zod, 변형 관리를 위한 class-variance-authority, 애니메이션 라이브러리인 Framer Motion, 아이콘 라이브러리인 Lucide React가 포함됩니다.

### AI 기반 아키텍처 설계

ShadcnUIArchitectOptimizer 클래스는 Context7 MCP 통합을 사용하여 최적의 shadcn/ui 아키텍처를 설계합니다. Context7 클라이언트, 컴포넌트 분석기, 테마 최적화기를 초기화합니다. design_optimal_shadcn_architecture 메서드는 디자인 시스템 요구사항을 받아 Context7를 통해 최신 shadcn/ui 및 React 문서를 가져옵니다. 그런 다음 UI 컴포넌트와 사용자 요구사항을 기반으로 컴포넌트 선택을 최적화하고, 브랜드 가이드라인과 접근성 요구사항을 기반으로 테마 구성을 최적화하며, 컴포넌트 라이브러리, 테마 시스템, 접근성 준수, 성능 최적화, 통합 패턴, 커스터마이징 전략을 포함하는 완전한 ShadcnUIArchitecture를 반환합니다.

### 모범 사례

요구사항에는 테마 커스터마이징을 위한 CSS 변수 사용, 적절한 TypeScript 타입 구현, WCAG 2.1 AA 준수를 위한 접근성 가이드라인 준수, 복잡한 상호작용을 위한 Radix UI 프리미티브 사용, React Testing Library로 컴포넌트 테스트, 트리 셰이킹으로 번들 크기 최적화, 반응형 디자인 패턴 구현이 포함됩니다.

중요 구현 표준:

[HARD] 색상 값에는 CSS 변수만 사용해야 합니다. 이는 동적 테마 적용, 다크 모드 전환 지원, 모든 컴포넌트에 걸친 디자인 시스템 일관성 유지를 가능하게 합니다. CSS 변수 없이는 테마 변경에 코드 수정이 필요하고, 다크 모드가 실패하며, 브랜드 커스터마이징이 유지보수 불가능해집니다.

[HARD] 모든 인터랙티브 요소에 접근성 속성을 포함해야 합니다. 이는 WCAG 2.1 AA 준수, 스크린 리더 호환성, 장애가 있는 사용자를 위한 포용적 사용자 경험을 보장합니다. 접근성 속성이 누락되면 장애가 있는 사용자가 배제되고, 법적 준수 요구사항을 위반하며, 애플리케이션 사용성이 저하됩니다.

[HARD] 모든 인터랙티브 컴포넌트에 키보드 네비게이션을 구현해야 합니다. 이는 키보드 사용자에게 필수적인 네비게이션 방법을 제공하고, 보조 기술을 지원하며, 전반적인 사용자 경험 효율성을 향상시킵니다. 키보드 네비게이션 없이는 파워 유저가 애플리케이션을 효율적으로 사용할 수 없고 접근성 준수가 실패합니다.

[SOFT] 비동기 작업에 대한 로딩 상태를 제공합니다. 이는 사용자에게 작업 진행 상황을 전달하고, 체감 지연 시간을 줄이며, 애플리케이션 응답성에 대한 사용자 신뢰를 향상시킵니다.

[HARD] 컴포넌트 트리 주위에 에러 바운더리를 구현해야 합니다. 이는 격리된 컴포넌트 장애로 인한 전체 애플리케이션 충돌을 방지하고, 우아한 에러 복구를 가능하게 하며, 애플리케이션 안정성을 유지합니다.

[HARD] 인라인 스타일 대신 Tailwind CSS 클래스를 적용해야 합니다. 이는 디자인 시스템과의 일관성을 유지하고, JIT 컴파일 이점을 활성화하며, 반응형 디자인 변형을 지원하고, 번들 크기 최적화를 향상시킵니다.

[SOFT] 모든 컴포넌트에 다크 모드 지원을 구현합니다. 이는 사용자 선호도를 존중하고, 저조도 환경에서 눈의 피로를 줄이며, 현대적인 UI 기대에 부응합니다.

### 성능 최적화

번들 크기 최적화에는 사용하지 않는 컴포넌트를 제거하는 트리 셰이킹, 대형 컴포넌트를 위한 코드 분할, React.lazy를 사용한 지연 로딩, 무거운 의존성을 위한 동적 임포트가 포함됩니다.

런타임 성능 최적화에는 비용이 큰 컴포넌트를 위한 React.memo, 계산을 위한 useMemo와 useCallback, 대규모 리스트를 위한 가상 스크롤링, 사용자 상호작용 디바운싱이 포함됩니다.

접근성에는 모든 인터랙티브 요소에 대한 ARIA 속성, 키보드 네비게이션 지원, 포커스 관리, 스크린 리더 테스트가 포함됩니다.

---

## 고급 패턴

### 컴포넌트 조합

조합 가능한 패턴은 ui/card 컴포넌트에서 Card, CardHeader, CardTitle, CardContent를 임포트하는 것을 포함합니다. DashboardCard 컴포넌트는 title과 children props를 받아 CardTitle을 포함하는 CardHeader와 children을 포함하는 CardContent가 있는 Card 구조로 감쌉니다.

### 폼 유효성 검사

Zod와 React Hook Form 통합 패턴은 react-hook-form에서 useForm을, hookform/resolvers/zod에서 zodResolver를, zod에서 z를 임포트하는 것을 포함합니다. 이메일에 z.string().email(), 비밀번호에 z.string().min(8) 같은 필드 유효성 검사를 포함하는 z.object로 formSchema를 정의합니다. 스키마에서 FormValues 타입을 추론합니다. 폼 컴포넌트는 formSchema를 전달하는 zodResolver와 함께 useForm을 사용합니다. 폼 요소는 onSubmit 핸들러와 함께 form.handleSubmit을 사용합니다.

---

## 함께 사용하면 좋은 것들

- 고급 컴포넌트 패턴과 구현을 위한 shadcn-components.md 모듈
- 테마 시스템과 커스터마이징 전략을 위한 shadcn-theming.md 모듈
- 디자인 시스템 아키텍처와 원칙을 위한 moai-domain-uiux
- TypeScript 모범 사례를 위한 moai-lang-typescript
- 프론트엔드 개발 패턴을 위한 code-frontend

---

## Context7 통합

관련 라이브러리:

- /shadcn-ui/ui의 shadcn/ui는 Radix UI와 Tailwind로 구축된 재사용 가능한 컴포넌트를 제공합니다
- /radix-ui/primitives의 Radix UI는 스타일이 없는 접근 가능한 컴포넌트 프리미티브를 제공합니다
- /tailwindlabs/tailwindcss의 Tailwind CSS는 유틸리티 우선 CSS 프레임워크를 제공합니다

공식 문서:

- ui.shadcn.com/docs의 shadcn/ui 문서
- ui.shadcn.com/docs/components의 API 레퍼런스
- radix-ui.com의 Radix UI 문서
- tailwindcss.com의 Tailwind CSS 문서

2025년 11월 기준 최신 버전:

- React 19
- TypeScript 5.5
- Tailwind CSS 3.4
- Radix UI 최신

---

최종 업데이트: 2026-01-11
상태: 프로덕션 준비 완료
