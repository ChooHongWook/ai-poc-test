# 엔터프라이즈 shadcn/ui 컴포넌트 라이브러리 전문가

## 빠른 참조

AI 기반 디자인 시스템 아키텍처, Context7 통합, 모던 React 애플리케이션을 위한 지능형 컴포넌트 오케스트레이션을 갖춘 종합 shadcn/ui 전문 지식.

핵심 역량:

- Context7 MCP를 활용한 AI 기반 컴포넌트 아키텍처
- 자동 테마 커스터마이징이 포함된 지능형 디자인 시스템
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

- 핵심 개념: 이 파일은 shadcn/ui 개요, 아키텍처, 생태계를 다룹니다
- 컴포넌트: shadcn-components.md 모듈은 컴포넌트 라이브러리 및 고급 패턴을 다룹니다
- 테마: shadcn-theming.md 모듈은 테마 시스템 및 커스터마이징을 다룹니다
- 고급 패턴: advanced-patterns.md 모듈은 복잡한 구현을 다룹니다
- 최적화: optimization.md 모듈은 성능 튜닝을 다룹니다

---

## 구현 가이드

### shadcn/ui 개요

shadcn/ui는 Radix UI와 Tailwind CSS로 구축된 재사용 가능한 컴포넌트 컬렉션입니다. 전통적인 컴포넌트 라이브러리와 달리 npm 패키지가 아니라 프로젝트에 복사하는 컴포넌트 컬렉션입니다.

주요 장점: 컴포넌트에 대한 완전한 제어 및 소유권, Radix UI 프리미티브 외 제로 의존성, Tailwind CSS로 완전한 커스터마이징, 뛰어난 타입 안전성을 갖춘 TypeScript 우선 설계, WCAG 2.1 AA 준수가 내장된 접근성.

아키텍처 철학: shadcn/ui 컴포넌트는 스타일이 없는 접근성 프리미티브를 제공하는 Radix UI Primitives 위에 구축됩니다. Tailwind CSS가 유틸리티 우선 스타일링을 제공합니다. TypeScript가 전체적으로 타입 안전성을 보장합니다. 커스터마이징 레이어가 최종 구현에 대한 완전한 제어를 제공합니다.

### 핵심 컴포넌트 카테고리

폼 컴포넌트: Input, Select, Checkbox, Radio, Textarea를 포함합니다. 폼 유효성 검사는 react-hook-form 및 Zod와 통합됩니다. 적절한 ARIA 레이블을 통해 접근성이 보장됩니다.

디스플레이 컴포넌트: Card, Dialog, Sheet, Drawer, Popover를 포함합니다. 반응형 디자인 패턴이 내장되어 있습니다. 다크 모드 지원이 포함되어 있습니다.

내비게이션 컴포넌트: Navigation Menu, Breadcrumb, Tabs, Pagination을 포함합니다. 키보드 내비게이션 지원이 내장되어 있습니다. 포커스 관리가 자동으로 처리됩니다.

데이터 컴포넌트: Table, Calendar, DatePicker, Charts를 포함합니다. 대용량 데이터셋을 위한 가상 스크롤링이 가능합니다. TanStack Table 통합이 지원됩니다.

피드백 컴포넌트: Alert, Toast, Progress, Badge, Avatar를 포함합니다. 로딩 상태 및 스켈레톤이 가능합니다. 에러 바운더리가 지원됩니다.

### 설치 및 설정

1단계: 최신 버전으로 npx를 사용하여 shadcn-ui init 명령을 실행하여 shadcn/ui를 초기화합니다.

2단계: ui.shadcn.com/schema.json을 가리키는 스키마 URL로 components.json을 구성합니다. 스타일을 default로 설정하고 RSC와 TSX를 활성화합니다. config 경로, CSS 경로, 기본 색상, CSS 변수 활성화, 선택적 접두사를 포함한 Tailwind 설정을 구성합니다. 컴포넌트, utils, ui 경로에 대한 별칭을 설정합니다.

3단계: npx로 shadcn-ui add 명령을 사용하여 button, form, dialog 등의 컴포넌트 이름을 지정하여 개별적으로 컴포넌트를 추가합니다.

### 기반 기술

React 19 기능: 서버 컴포넌트 지원, 동시 렌더링 기능, 자동 배칭 개선, 스트리밍 SSR 향상을 포함합니다.

TypeScript 5.5: 컴포넌트 전반에 걸친 완전한 타입 안전성, 제네릭에 대한 향상된 추론, 더 나은 오류 메시지, 향상된 개발자 경험을 제공합니다.

Tailwind CSS 3.4: JIT 컴파일, CSS 변수 지원, 다크 모드 변형, 컨테이너 쿼리를 포함합니다.

Radix UI: 스타일이 없는 접근성 프리미티브, 키보드 내비게이션, 포커스 관리, ARIA 속성을 제공합니다.

통합 스택: 폼 상태 관리를 위한 React Hook Form, 스키마 유효성 검사를 위한 Zod, 변형 관리를 위한 class-variance-authority, 애니메이션 라이브러리를 위한 Framer Motion, 아이콘 라이브러리를 위한 Lucide React를 포함합니다.

### AI 기반 아키텍처 설계

ShadcnUIArchitectOptimizer 클래스는 Context7 MCP 통합을 사용하여 최적의 shadcn/ui 아키텍처를 설계합니다. Context7 클라이언트, 컴포넌트 분석기, 테마 옵티마이저를 초기화합니다. design_optimal_shadcn_architecture 메서드는 디자인 시스템 요구사항을 받아 Context7를 통해 최신 shadcn/ui 및 React 문서를 가져옵니다. UI 컴포넌트 및 사용자 요구에 따라 컴포넌트 선택을 최적화하고, 브랜드 가이드라인 및 접근성 요구사항에 따라 테마 구성을 최적화하며, 컴포넌트 라이브러리, 테마 시스템, 접근성 준수, 성능 최적화, 통합 패턴, 커스터마이징 전략을 포함한 완전한 ShadcnUIArchitecture를 반환합니다.

### 모범 사례

요구사항: 테마 커스터마이징에 CSS 변수 사용, 적절한 TypeScript 타입 구현, WCAG 2.1 AA 준수를 위한 접근성 가이드라인 따르기, 복잡한 인터랙션에 Radix UI 프리미티브 사용, React Testing Library로 컴포넌트 테스트, 트리 셰이킹으로 번들 사이즈 최적화, 반응형 디자인 패턴 구현.

주요 구현 표준:

[필수] 색상 값에 CSS 변수만 사용합니다. 이는 동적 테마, 다크 모드 전환 지원, 모든 컴포넌트에서 디자인 시스템 일관성을 유지합니다. CSS 변수 없이는 테마 변경에 코드 수정이 필요하고 다크 모드가 실패하며 브랜드 커스터마이징이 유지보수 불가능해집니다.

[필수] 모든 인터랙티브 요소에 접근성 속성을 포함합니다. 이는 WCAG 2.1 AA 준수, 스크린 리더 호환성, 장애가 있는 사용자를 위한 포용적 사용자 경험을 보장합니다. 접근성 속성 누락은 장애가 있는 사용자를 배제하고, 법적 준수 요구사항을 위반하며, 애플리케이션 사용성을 저하시킵니다.

[필수] 모든 인터랙티브 컴포넌트에 키보드 내비게이션을 구현합니다. 이는 키보드 사용자를 위한 필수 내비게이션 방법을 제공하고, 보조 기술을 지원하며, 전체적인 사용자 경험 효율성을 향상시킵니다. 키보드 내비게이션 없이는 파워 유저가 애플리케이션을 효율적으로 사용할 수 없고 접근성 준수가 실패합니다.

[권장] 비동기 작업에 로딩 상태를 제공합니다. 이는 작업 진행 상황을 사용자에게 전달하고, 인지된 지연 시간을 줄이며, 애플리케이션 반응성에 대한 사용자 신뢰를 향상시킵니다.

[필수] 컴포넌트 트리 주변에 에러 바운더리를 구현합니다. 이는 격리된 컴포넌트 실패로 인한 전체 애플리케이션 크래시를 방지하고, 우아한 오류 복구를 가능하게 하며, 애플리케이션 안정성을 유지합니다.

[필수] 인라인 스타일 대신 Tailwind CSS 클래스를 적용합니다. 이는 디자인 시스템과의 일관성을 유지하고, JIT 컴파일 혜택을 가능하게 하며, 반응형 디자인 변형을 지원하고, 번들 사이즈 최적화를 개선합니다.

[권장] 모든 컴포넌트에 다크 모드 지원을 구현합니다. 이는 사용자 선호도 존중, 저조도 환경에서의 눈 피로 감소, 모던 UI 기대치에 부합합니다.

### 성능 최적화

번들 사이즈 최적화: 사용하지 않는 컴포넌트 제거를 위한 트리 셰이킹, 대형 컴포넌트를 위한 코드 스플리팅, React.lazy를 활용한 지연 로딩, 무거운 의존성을 위한 동적 임포트를 포함합니다.

런타임 성능 최적화: 비용이 큰 컴포넌트를 위한 React.memo, 계산을 위한 useMemo 및 useCallback, 대형 리스트를 위한 가상 스크롤링, 사용자 인터랙션 디바운싱을 포함합니다.

접근성: 모든 인터랙티브 요소에 대한 ARIA 속성, 키보드 내비게이션 지원, 포커스 관리, 스크린 리더 테스팅을 포함합니다.

---

## 고급 패턴

### 컴포넌트 합성

합성 가능한 패턴은 ui/card 컴포넌트에서 Card, CardHeader, CardTitle, CardContent를 임포트합니다. DashboardCard 컴포넌트는 title과 children props를 받아 CardTitle을 포함한 CardHeader와 children을 포함한 CardContent가 있는 Card 구조로 감쌉니다.

### 폼 유효성 검사

Zod 및 React Hook Form 통합 패턴은 react-hook-form에서 useForm을, hookform/resolvers/zod에서 zodResolver를, zod에서 z를 임포트합니다. 이메일에 z.string().email(), 비밀번호에 z.string().min(8) 등의 필드 유효성 검사를 포함한 z.object로 formSchema를 정의합니다. 스키마에서 FormValues 타입을 추론합니다. 폼 컴포넌트는 formSchema를 전달하는 zodResolver와 함께 useForm을 사용합니다. 폼 요소는 onSubmit 핸들러와 함께 form.handleSubmit을 사용합니다.

---

## 함께 사용하면 좋은 것들

- shadcn-components.md 모듈 - 고급 컴포넌트 패턴 및 구현
- shadcn-theming.md 모듈 - 테마 시스템 및 커스터마이징 전략
- moai-domain-uiux - 디자인 시스템 아키텍처 및 원칙
- moai-lang-typescript - TypeScript 모범 사례
- code-frontend - 프론트엔드 개발 패턴

---

## Context7 통합

관련 라이브러리:

- /shadcn-ui/ui의 shadcn/ui - Radix UI 및 Tailwind로 구축된 재사용 가능한 컴포넌트 제공
- /radix-ui/primitives의 Radix UI - 스타일이 없는 접근성 컴포넌트 프리미티브 제공
- /tailwindlabs/tailwindcss의 Tailwind CSS - 유틸리티 우선 CSS 프레임워크 제공

공식 문서:

- shadcn/ui 문서: ui.shadcn.com/docs
- API 참조: ui.shadcn.com/docs/components
- Radix UI 문서: radix-ui.com
- Tailwind CSS 문서: tailwindcss.com

최신 버전 (2025년 11월 기준):

- React 19
- TypeScript 5.5
- Tailwind CSS 3.4
- Radix UI 최신

---

최종 업데이트: 2026-01-11
상태: 프로덕션 준비 완료
