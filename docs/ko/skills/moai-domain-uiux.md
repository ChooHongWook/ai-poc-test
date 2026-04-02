# UI/UX 디자인 시스템 스페셜리스트

## 빠른 참조

핵심 UI/UX 기반 - 디자인 시스템(W3C DTCG 2025.10), 컴포넌트 아키텍처(React 19, Vue 3.5), 접근성(WCAG 2.2), 아이콘 라이브러리(200K+ 아이콘), 테마 시스템을 통합하는 엔터프라이즈급 UI/UX 기반.

통합 역량:

- 디자인 시스템: W3C DTCG 2025.10 토큰, Style Dictionary 4.0, Pencil MCP 워크플로우
- 컴포넌트 아키텍처: 아토믹 디자인, React 19, Vue 3.5, shadcn/ui, Radix UI 프리미티브
- 접근성: WCAG 2.2 AA/AAA 준수, 키보드 내비게이션, 스크린 리더 최적화
- 아이콘 라이브러리: 10개 이상 생태계 (Lucide, React Icons 35K+, Tabler 5900+, Iconify 200K+, Hugeicons 27K+)
- 테마: CSS 변수, 라이트/다크 모드, 테마 프로바이더, 브랜드 커스터마이징

사용 시점:

- 디자인 시스템 기반의 최신 UI 컴포넌트 라이브러리 구축
- 접근성 높은 엔터프라이즈급 사용자 인터페이스 구현
- 멀티 플랫폼 프로젝트를 위한 디자인 토큰 아키텍처 설정
- 최적의 번들 사이즈로 종합적인 아이콘 시스템 통합
- 다크 모드를 지원하는 커스터마이징 가능한 테마 시스템 생성

모듈 구성:

- 컴포넌트: modules/component-architecture.md (아토믹 디자인, 컴포넌트 패턴, Props API)
- 디자인 시스템: modules/design-system-tokens.md (DTCG 토큰, Style Dictionary, Pencil MCP)
- 접근성: modules/accessibility-wcag.md (WCAG 2.2 준수, 테스팅, 내비게이션)
- 아이콘: modules/icon-libraries.md (10개 이상 라이브러리, 선택 가이드, 성능 최적화)
- 테마: modules/theming-system.md (테마 시스템, CSS 변수, 브랜드 커스터마이징)
- 웹 인터페이스 가이드라인: modules/web-interface-guidelines.md (Vercel Labs 종합 UI/UX 준수)
- 예제: examples.md (실용적인 구현 예제)
- 참조: reference.md (외부 문서 링크)

---

## 구현 가이드

### 기반 스택

핵심 기술:

- React 19 - 서버 컴포넌트 및 동시 렌더링
- TypeScript 5.9+ - 완전한 타입 안전성과 향상된 추론
- Tailwind CSS 4.x - CSS 우선 설정, CSS 변수, 다크 모드
- Radix UI - 스타일 없는 접근성 높은 프리미티브
- W3C DTCG 2025.10 - 디자인 토큰 사양
- Style Dictionary 4.0 - 토큰 변환
- Pencil MCP - 디자인-코드 자동화
- Storybook 8.x - 컴포넌트 문서화

빠른 결정 가이드:

디자인 토큰은 modules/design-system-tokens.md에서 DTCG 2025.10과 Style Dictionary 4.0을 사용합니다.

컴포넌트 패턴은 modules/component-architecture.md에서 아토믹 디자인, React 19, shadcn/ui를 사용합니다.

접근성은 modules/accessibility-wcag.md에서 WCAG 2.2, jest-axe, 키보드 내비게이션을 사용합니다.

아이콘은 modules/icon-libraries.md에서 Lucide, React Icons, Tabler, Iconify, Hugeicons를 사용합니다.

Nova 프리셋 및 디자인 프리셋은 moai-design-tools 스킬(reference/pencil-renderer.md)을 사용합니다.

테마는 modules/theming-system.md에서 CSS 변수와 테마 프로바이더를 사용합니다.

실용적인 예제는 examples.md에서 React와 Vue 구현을 사용합니다.

---

## 빠른 시작 워크플로우

### 디자인 시스템 설정

1단계: DTCG 스키마 URL이 포함된 JSON 파일을 생성하여 디자인 토큰을 초기화합니다. color 타입의 primary 500 값으로 색상 토큰을 정의합니다. dimension 타입의 md 값 1rem으로 간격 토큰을 정의합니다.

2단계: Style Dictionary 패키지를 설치하고 빌드 명령을 실행하여 토큰을 변환합니다.

3단계: 토큰 디렉토리에서 색상과 간격을 임포트하여 컴포넌트에 통합합니다.

상세 토큰 아키텍처는 modules/design-system-tokens.md를 참조하세요.

### 컴포넌트 라이브러리 설정

1단계: init 명령을 실행하여 shadcn/ui를 초기화한 다음, button, form, dialog 컴포넌트를 추가합니다.

2단계: Button, Input, Label 컴포넌트를 위한 atoms 디렉토리, FormGroup과 Card 컴포넌트를 위한 molecules 디렉토리, DataTable과 Modal 컴포넌트를 위한 organisms 디렉토리로 아토믹 디자인 구조를 설정합니다.

3단계: 인터랙티브 요소에 aria-label 속성을 추가하여 접근성과 함께 구현합니다.

패턴과 예제는 modules/component-architecture.md를 참조하세요.

### 아이콘 시스템 통합

1단계: 필요에 따라 아이콘 라이브러리를 선택합니다. 범용으로는 lucide-react를, 최대 다양성을 위해서는 iconify/react를, 대시보드 최적화를 위해서는 tabler/icons-react를 설치합니다.

2단계: 특정 아이콘을 임포트하고 사이즈와 색상을 위한 className을 적용하여 타입 안전한 아이콘을 구현합니다.

라이브러리 비교 및 최적화는 modules/icon-libraries.md를 참조하세요.

### 테마 시스템 설정

1단계: root 선택자에서 primary와 background 색상을 위한 CSS 변수를 설정합니다. 다크 모드를 위해 반전된 값을 가진 dark 클래스를 정의합니다.

2단계: attribute를 class로, defaultTheme을 system으로 설정하여 애플리케이션을 테마 프로바이더로 감싸서 구현합니다.

완전한 테마 시스템은 modules/theming-system.md를 참조하세요.

---

## 핵심 원칙

디자인 토큰 우선:

- 디자인 결정을 위한 단일 진실 공급원
- blue-500 대신 color.primary.500 형식의 시맨틱 네이밍
- 라이트와 다크 모드를 위한 멀티 테마 지원
- 플랫폼 독립적 변환

기본 접근성:

- 4.5:1 텍스트 대비를 갖춘 WCAG 2.2 AA 최소 기준
- 모든 인터랙티브 요소에 키보드 내비게이션
- 스크린 리더를 위한 ARIA 속성
- 포커스 관리 및 가시적 인디케이터

컴포넌트 구성:

- Atoms에서 Molecules, Organisms까지의 아토믹 디자인 계층
- 재사용성을 위한 Props API
- 별도 컴포넌트가 아닌 변형 기반 스타일링
- TypeScript를 활용한 타입 안전

성능 최적화:

- 전체가 아닌 특정 아이콘 임포트를 통한 트리 쉐이킹
- 대형 컴포넌트의 지연 로딩
- 비용이 큰 렌더링을 위한 React.memo
- 번들 사이즈 모니터링

---

## 모범 사례

필수 사례:

모든 색상, 간격, 타이포그래피 값에 디자인 토큰만 사용합니다. 디자인 토큰은 단일 진실 공급원을 제공하여 일관된 테마, 멀티 플랫폼 지원, 확장 가능한 디자인 시스템을 가능하게 합니다. 하드코딩된 값은 유지보수 부채를 만들고 테마 전환을 깨뜨립니다.

모든 아이콘 전용 인터랙티브 요소에 ARIA 레이블을 포함합니다. 스크린 리더는 텍스트 대안 없이 시각적 아이콘을 해석할 수 없습니다. ARIA 레이블 누락은 WCAG 2.2 AA 준수를 위반합니다.

네임스페이스 임포트 대신 개별 아이콘을 임포트합니다. 네임스페이스 임포트는 전체 라이브러리를 번들하여 트리 쉐이킹 최적화를 무력화합니다. 아이콘 라이브러리당 번들 사이즈가 500KB-2MB 증가합니다.

모든 컴포넌트를 라이트와 다크 모드 양쪽에서 테스트합니다. 테마 전환은 색상 대비, 가독성, 접근성 준수에 영향을 미칩니다.

모든 인터랙티브 컴포넌트에 키보드 내비게이션을 구현합니다. 키보드만 사용하는 사용자는 Tab, Enter, Escape, 화살표 키 지원이 필요합니다.

모든 포커스 가능한 요소에 가시적 포커스 인디케이터를 제공합니다. 포커스 인디케이터는 내비게이션과 접근성을 위한 현재 키보드 위치를 전달합니다.

인라인 스타일 대신 Tailwind 유틸리티 클래스를 사용합니다. Tailwind는 일관된 간격 스케일, 반응형 디자인, 최적 번들 사이즈를 위한 자동 퍼징을 제공합니다.

모든 비동기 작업에 로딩 상태를 포함합니다. 로딩 상태는 데이터 페칭 중 피드백을 제공하여 사용자 불확실성을 방지합니다.

---

## 함께 사용하면 좋은 스킬

스킬:

- moai-lang-typescript - TypeScript 및 JavaScript 모범 사례
- moai-foundation-core - TRUST 5 품질 검증
- moai-library-nextra - 문서 생성
- moai-library-shadcn - shadcn/ui 전문 패턴

에이전트:

- code-frontend - 프론트엔드 컴포넌트 구현
- design-uiux - 디자인 시스템 아키텍처
- mcp-pencil - Pencil MCP 디자인 워크플로우
- core-quality - 접근성 및 품질 검증

명령:

- /moai:2-run - DDD 구현 주기
- /moai:3-sync - 문서 생성

---

## 리소스

상세 모듈 문서는 modules 디렉토리를 참조하세요.

실용적인 코드 예제는 examples.md를 참조하세요.

외부 문서 링크는 reference.md를 참조하세요.

공식 리소스:

- W3C DTCG: https://designtokens.org
- WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
- React 19: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Radix UI: https://www.radix-ui.com
- shadcn/ui: https://ui.shadcn.com
- Storybook: https://storybook.js.org
- Pencil: https://docs.pencil.dev
- Style Dictionary: https://styledictionary.com
- Lucide Icons: https://lucide.dev
- Iconify: https://iconify.design
- Vercel Web Interface Guidelines: https://github.com/vercel-labs/web-interface-guidelines

---

최종 업데이트: 2026-03-11
상태: 프로덕션 준비 완료
버전: 3.0.0
