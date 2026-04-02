# 외부 문서 참조

UI/UX 개발을 위한 공식 문서, 명세, 리소스의 종합 모음입니다.

---

## 디자인 시스템 및 토큰

### W3C Design Tokens Community Group (DTCG)
- 명세: https://designtokens.org
- GitHub: https://github.com/design-tokens/community-group
- 포맷 명세: https://tr.designtokens.org/format/
- 최신 버전: 2025.10 (첫 안정 릴리스)
- 사용 사례: 디자인 토큰 아키텍처, 멀티 플랫폼 테마

### Style Dictionary
- 문서: https://styledictionary.com
- GitHub: https://github.com/amzn/style-dictionary
- 버전: 4.0+ (DTCG 호환)
- 사용 사례: 토큰 변환, 플랫폼별 출력

---

## 접근성 표준

### WCAG 2.2 (웹 콘텐츠 접근성 지침)
- 빠른 참조: https://www.w3.org/WAI/WCAG22/quickref/
- 전체 명세: https://www.w3.org/TR/WCAG22/
- WCAG 이해하기: https://www.w3.org/WAI/WCAG22/Understanding/
- Level AA 요구사항: https://www.w3.org/WAI/WCAG22/quickref/?currentsidebar=%23col_overview&levels=aaa
- 사용 사례: 접근성 준수, ARIA 패턴, 대비 비율

### axe DevTools
- 웹사이트: https://www.deque.com/axe/devtools/
- 문서: https://www.deque.com/axe/devtools/documentation/
- Chrome 확장: https://chrome.google.com/webstore/detail/axe-devtools/lhdoppojpmngadmnindnejefpokejbdd
- 사용 사례: 자동화된 접근성 테스트

### jest-axe
- GitHub: https://github.com/nickcolley/jest-axe
- npm: https://www.npmjs.com/package/jest-axe
- 사용 사례: 유닛 테스트에서의 접근성 테스트

---

## 컴포넌트 라이브러리 및 프레임워크

### React 19
- 공식 문서: https://react.dev
- API 참조: https://react.dev/reference/react
- Server Components: https://react.dev/reference/react/use-server
- 최신 기능: https://react.dev/blog
- 사용 사례: 최신 React 패턴, Server Components, Suspense

### Vue 3.5
- 공식 문서: https://vuejs.org
- Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- TypeScript: https://vuejs.org/guide/typescript/overview.html
- 사용 사례: Vue 컴포넌트 개발, Composition API

### shadcn/ui
- 문서: https://ui.shadcn.com/docs
- 컴포넌트: https://ui.shadcn.com/docs/components
- 설치: https://ui.shadcn.com/docs/installation
- GitHub: https://github.com/shadcn-ui/ui
- 사용 사례: 복사-붙여넣기 컴포넌트 라이브러리, Radix UI + Tailwind

### Radix UI
- 문서: https://www.radix-ui.com
- 프리미티브: https://www.radix-ui.com/primitives/docs/overview/introduction
- 테마: https://www.radix-ui.com/themes/docs/overview/getting-started
- 사용 사례: 스타일 없는 접근성 컴포넌트 프리미티브

---

## 스타일링 및 테마

### Tailwind CSS 3.4
- 문서: https://tailwindcss.com/docs
- 설정: https://tailwindcss.com/docs/configuration
- 다크 모드: https://tailwindcss.com/docs/dark-mode
- 커스터마이징: https://tailwindcss.com/docs/theme
- 사용 사례: 유틸리티 우선 CSS, 디자인 토큰 통합

### CSS 변수
- MDN 참조: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- 브라우저 지원: https://caniuse.com/css-variables
- 사용 사례: 동적 테마, 디자인 토큰 구현

---

## 아이콘 라이브러리

### Lucide Icons
- 웹사이트: https://lucide.dev
- React: https://lucide.dev/guide/packages/lucide-react
- 아이콘: https://lucide.dev/icons/
- GitHub: https://github.com/lucide-icons/lucide
- 번들 크기: ~30KB (1000개 이상 아이콘)

### React Icons
- 웹사이트: https://react-icons.github.io/react-icons/
- GitHub: https://github.com/react-icons/react-icons
- 아이콘: 여러 라이브러리에서 35,000개 이상 아이콘
- 사용 사례: 멀티 라이브러리 지원, 모듈형 임포트

### Tabler Icons
- 웹사이트: https://tabler-icons.io
- React: https://tabler-icons.io/docs/icons/react
- GitHub: https://github.com/tabler/tabler-icons
- 아이콘: 5900개 이상 (대시보드 최적화)

### Iconify
- 웹사이트: https://iconify.design
- React: https://docs.iconify.design/icon-components/react/
- 아이콘 세트: https://icon-sets.iconify.design
- 아이콘: 200,000개 이상 (CDN 기반)

### Heroicons
- 웹사이트: https://heroicons.com
- GitHub: https://github.com/tailwindlabs/heroicons
- React: https://github.com/tailwindlabs/heroicons#react
- 아이콘: 300개 이상 (Tailwind CSS 공식 아이콘)

### Phosphor Icons
- 웹사이트: https://phosphoricons.com
- React: https://github.com/phosphor-icons/react
- 아이콘: 6가지 두께 변형이 있는 800개 이상 아이콘
- 사용 사례: 두께 유연성 (thin, light, regular, bold, fill, duotone)

### Radix Icons
- 웹사이트: https://www.radix-ui.com/icons
- GitHub: https://github.com/radix-ui/icons
- 아이콘: 150개 이상 (정밀 15x15px)
- 번들 크기: ~5KB (최소 풋프린트)

---

## 디자인-투-코드 도구

### Pencil MCP
- 문서: https://docs.pencil.dev
- 서버 설정: Pencil IDE 확장 또는 데스크탑 앱으로 자동 시작
- 사용 사례: .pen 파일을 활용한 Design-as-Code, 디자인 토큰 관리, 컴포넌트 코드 생성

### Storybook 8.x
- 문서: https://storybook.js.org/docs
- React: https://storybook.js.org/docs/react/get-started/introduction
- 애드온: https://storybook.js.org/docs/react/essentials/introduction
- 사용 사례: 컴포넌트 문서화, 시각적 테스트

### Chromatic
- 웹사이트: https://www.chromatic.com
- 문서: https://www.chromatic.com/docs/
- GitHub Action: https://github.com/chromaui/action
- 사용 사례: 시각적 회귀 테스트, Storybook 통합

---

## 폼 유효성 검사 및 상태 관리

### React Hook Form
- 문서: https://react-hook-form.com
- API: https://react-hook-form.com/api
- 예제: https://react-hook-form.com/get-started
- 사용 사례: 폼 상태 관리, 유효성 검사

### Zod
- 문서: https://zod.dev
- GitHub: https://github.com/colinhacks/zod
- TypeScript 통합: https://zod.dev/?id=typescript
- 사용 사례: 스키마 유효성 검사, 타입 추론

### TanStack Table
- 문서: https://tanstack.com/table/latest
- React: https://tanstack.com/table/latest/docs/framework/react/react-table
- 예제: https://tanstack.com/table/latest/docs/framework/react/examples
- 사용 사례: 데이터 테이블, 정렬, 필터링, 페이지네이션

---

## TypeScript 및 도구

### TypeScript 5.5
- 문서: https://www.typescriptlang.org/docs/
- 핸드북: https://www.typescriptlang.org/docs/handbook/intro.html
- 릴리스 노트: https://www.typescriptlang.org/docs/handbook/release-notes/overview.html
- 사용 사례: 타입 안전성, 개선된 개발자 경험

### class-variance-authority (CVA)
- GitHub: https://github.com/joe-bell/cva
- 문서: https://cva.style/docs
- 사용 사례: 컴포넌트 변형 관리

---

## 테스트

### React Testing Library
- 문서: https://testing-library.com/docs/react-testing-library/intro/
- API: https://testing-library.com/docs/react-testing-library/api
- 예제: https://testing-library.com/docs/react-testing-library/example-intro
- 사용 사례: 컴포넌트 테스트, 사용자 중심 테스트

### Vitest
- 문서: https://vitest.dev
- API: https://vitest.dev/api/
- 설정: https://vitest.dev/config/
- 사용 사례: 빠른 유닛 테스트, Vite 통합

---

## 애니메이션 라이브러리

### Framer Motion
- 문서: https://www.framer.com/motion/
- API: https://www.framer.com/motion/component/
- 예제: https://www.framer.com/motion/examples/
- 사용 사례: React 애니메이션, 제스처

---

## 공식 명세

- HTML Living Standard: https://html.spec.whatwg.org/multipage/
- CSS 명세: https://www.w3.org/Style/CSS/specs.en.html
- WAI-ARIA: https://www.w3.org/TR/wai-aria-1.2/
- ARIA 작성 관행: https://www.w3.org/WAI/ARIA/apg/

---

## 커뮤니티 리소스

- MDN Web Docs: https://developer.mozilla.org
- Can I Use: https://caniuse.com
- WebAIM: https://webaim.org
- A11y Project: https://www.a11yproject.com
- Inclusive Components: https://inclusive-components.design

---

최종 업데이트: 2025-11-26
상태: 프로덕션 준비 완료
