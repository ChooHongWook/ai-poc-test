---
name: moai-foundation-uiux
description: Moai 디자인 시스템 - 전문 구현 가이드
version: 1.0.0
modularized: false
tags:
 - enterprise
 - systems
 - development
updated: 2025-11-24
status: active
---

## 빠른 참조 (30초)

# 디자인 시스템 개발 스킬

W3C DTCG 2025.10 토큰 표준, WCAG 2.2 접근성 준수, Pencil MCP 자동화 워크플로우를 활용한 엔터프라이즈 디자인 시스템 구현입니다.

핵심 역량:
- W3C DTCG 2025.10 디자인 토큰 아키텍처
- WCAG 2.2 AA/AAA 접근성 준수
- Pencil MCP 통합을 통한 디자인-투-코드 워크플로우
- Atomic Design 컴포넌트 패턴
- Storybook 문서화 및 시각적 회귀 테스트

사용 시점:
- 멀티 플랫폼 프로젝트를 위한 디자인 토큰 아키텍처를 설정할 때
- 접근성을 갖춘 컴포넌트 라이브러리를 구현할 때
- Pencil MCP로 디자인-투-코드 워크플로우를 자동화할 때
- Storybook으로 유지보수 가능한 디자인 시스템을 구축할 때
- 색상 대비 준수 및 시맨틱 토큰 네이밍을 보장할 때

모듈 구성:
- 핵심 개념: 이 파일 (디자인 토큰, DTCG 표준, 도구 생태계)
- 컴포넌트: [컴포넌트 아키텍처](component-architecture.md) (Atomic Design, 컴포넌트 패턴, Props API)
- 접근성: [접근성 WCAG](accessibility-wcag.md) (WCAG 2.2, 테스트, 키보드 내비게이션)

최신 표준 (2025년 11월):
- DTCG 명세: 2025.10 (첫 안정 버전)
- WCAG 가이드라인: 2.2 (AA: 텍스트 4.5:1, AAA: 텍스트 7:1)
- Pencil MCP: MCP 자동 시작 기능이 있는 .pen 파일
- Style Dictionary: 4.0 (DTCG 호환)
- Storybook: 8.x (Docs 애드온 포함)

---

## 구현 가이드

### 디자인 시스템 기반 - 3대 핵심 요소

1. 디자인 토큰 (단일 진실 공급원):
- 색상, 타이포그래피, 간격, 테두리, 그림자
- 시맨틱 네이밍: `color.primary.500`, `spacing.md`, `font.heading.lg`
- 멀티 테마 지원 (라이트/다크 모드)
- 형식: W3C DTCG 2025.10 JSON 또는 Style Dictionary 4.0

2. 컴포넌트 라이브러리 (Atomic Design 패턴):
- Atoms -> Molecules -> Organisms -> Templates -> Pages
- 재사용성과 합성을 위한 Props API
- 변형 상태: default, hover, active, disabled, error, loading
- 문서화: 자동 생성된 props/사용법이 포함된 Storybook

3. 접근성 표준 (WCAG 2.2 준수):
- 색상 대비: 텍스트 4.5:1 (AA), 7:1 (AAA)
- 키보드 내비게이션: 탭 순서, 포커스 관리
- 스크린 리더: ARIA 역할, 레이블, 라이브 영역
- 모션: `prefers-reduced-motion` 지원

### 도구 생태계

| 도구 | 버전 | 용도 | 공식 링크 |
|------|------|------|----------|
| W3C DTCG | 2025.10 | 디자인 토큰 명세 | https://designtokens.org |
| Style Dictionary | 4.0+ | 토큰 변환 엔진 | https://styledictionary.com |
| Pencil MCP | 최신 | 디자인-투-코드 자동화 | https://docs.pencil.dev |
| Storybook | 8.x | 컴포넌트 문서화 | https://storybook.js.org |
| axe DevTools | 최신 | 접근성 테스트 | https://www.deque.com/axe/devtools/ |
| Chromatic | 최신 | 시각적 회귀 테스트 | https://chromatic.com |

---

## 디자인 토큰 아키텍처 (DTCG 2025.10)

### 토큰 구조 - 시맨틱 네이밍 규칙

```json
{
 "$schema": "https://tr.designtokens.org/format/",
 "$tokens": {
 "color": {
 "$type": "color",
 "primary": {
 "50": { "$value": "#eff6ff" },
 "100": { "$value": "#dbeafe" },
 "500": { "$value": "#3b82f6" },
 "900": { "$value": "#1e3a8a" }
 },
 "semantic": {
 "text": {
 "primary": { "$value": "{color.gray.900}" },
 "secondary": { "$value": "{color.gray.600}" },
 "disabled": { "$value": "{color.gray.400}" }
 },
 "background": {
 "default": { "$value": "{color.white}" },
 "elevated": { "$value": "{color.gray.50}" }
 }
 }
 },
 "spacing": {
 "$type": "dimension",
 "xs": { "$value": "0.25rem" },
 "sm": { "$value": "0.5rem" },
 "md": { "$value": "1rem" },
 "lg": { "$value": "1.5rem" },
 "xl": { "$value": "2rem" }
 },
 "typography": {
 "$type": "fontFamily",
 "sans": { "$value": ["Inter", "system-ui", "sans-serif"] },
 "mono": { "$value": ["JetBrains Mono", "monospace"] }
 },
 "fontSize": {
 "$type": "dimension",
 "sm": { "$value": "0.875rem" },
 "base": { "$value": "1rem" },
 "lg": { "$value": "1.125rem" },
 "xl": { "$value": "1.25rem" }
 }
 }
}
```

### 멀티 테마 지원 (라이트/다크 모드)

```json
{
 "color": {
 "semantic": {
 "background": {
 "$type": "color",
 "default": {
 "$value": "{color.white}",
 "$extensions": {
 "mode": {
 "dark": "{color.gray.900}"
 }
 }
 }
 }
 }
 }
}
```

### Style Dictionary 설정 (4.0+)

```javascript
// style-dictionary.config.js
export default {
 source: ['tokens//*.json'],
 platforms: {
 css: {
 transformGroup: 'css',
 buildPath: 'build/css/',
 files: [{
 destination: 'variables.css',
 format: 'css/variables'
 }]
 },
 js: {
 transformGroup: 'js',
 buildPath: 'build/js/',
 files: [{
 destination: 'tokens.js',
 format: 'javascript/es6'
 }]
 },
 typescript: {
 transformGroup: 'js',
 buildPath: 'build/ts/',
 files: [{
 destination: 'tokens.ts',
 format: 'typescript/es6-declarations'
 }]
 }
 }
};
```

---

## Pencil MCP 통합

Pencil MCP 통합 워크플로우, 디자인 토큰 추출, .pen 파일 처리에 대해서는 다음을 참조하세요:
- 스킬: moai-design-tools (reference/pencil-renderer.md)
- 스킬: moai-design-tools (reference/pencil-code.md)

---

## 모범 사례

디자인 토큰 아키텍처:
- 시맨틱 네이밍 사용 (`color.blue`가 아닌 `color.primary.500`)
- 테마를 위한 앨리어싱 구현 (`{color.white}` 참조)
- DTCG 2025.10 명세 준수 검증
- 시맨틱 버저닝으로 토큰 버전 관리
- Storybook에서 토큰 사용법 문서화

컴포넌트 개발:
- Atomic Design 계층 구조 따르기 (Atoms -> Molecules -> Organisms)
- 변형 기반 Props API 생성 (별도 컴포넌트가 아닌)
- 모든 props를 TypeScript 타입으로 문서화
- 모든 변형에 대한 Storybook 스토리 작성
- jest-axe로 컴포넌트 접근성 테스트

접근성:
- 모든 텍스트에 4.5:1 대비 검증 (WCAG AA)
- 모든 대화형 요소에 키보드 내비게이션 구현
- 폼 필드와 버튼에 ARIA 레이블 추가
- 스크린 리더로 테스트 (NVDA, JAWS, VoiceOver)
- `prefers-reduced-motion` 지원

---

## 고급 패턴

### 타입 안전 디자인 토큰

```typescript
// scripts/generate-token-types.ts
import { readFileSync, writeFileSync } from 'fs';

interface DTCGToken {
 $value: string | number | string[];
 $type?: string;
 [key: string]: any;
}

function generateTypes(tokens: Record<string, any>, prefix = ''): string {
 let types = '';

 for (const [key, value] of Object.entries(tokens)) {
 if (value.$value !== undefined) {
 const tokenPath = `${prefix}${key}`.replace(/\./g, '-');
 types += `export const ${tokenPath} = '${value.$value}';\n`;
 } else {
 types += generateTypes(value, `${prefix}${key}.`);
 }
 }

 return types;
}

const colorTokens = JSON.parse(readFileSync('tokens/color.json', 'utf-8'));
const types = generateTypes(colorTokens.$tokens);
writeFileSync('src/tokens/colors.ts', types);
```

### 시각적 회귀 테스트 (Chromatic)

```bash
# Chromatic 설치
npm install --save-dev chromatic
```

CI/CD 통합:
```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on: [push]

jobs:
 chromatic:
 runs-on: ubuntu-latest
 steps:
 - uses: actions/checkout@v4
 with:
 fetch-depth: 0

 - uses: actions/setup-node@v4
 with:
 node-version: 20

 - name: 의존성 설치
 run: npm ci

 - name: Chromatic 실행
 uses: chromaui/action@v1
 with:
 projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

---

## 사용하지 말아야 할 경우

- 단순 정적 사이트: 복잡한 UI 요구사항이 없는 프로젝트에는 과도함
- 빠른 프로토타이핑: 초기 탐색 단계에서 디자인 시스템은 오버헤드 추가
- 일회성 프로젝트: 토큰 아키텍처는 장기 유지보수에 유리
- 비웹 플랫폼: 이 스킬은 웹(React/Vue/TypeScript)에 초점

이런 경우 고려할 대안:
- 정적 사이트에는 일반 CSS/Tailwind
- 빠른 개발에는 컴포넌트 라이브러리 (Material-UI, shadcn/ui)
- 플랫폼별 디자인 시스템 (iOS HIG, Android용 Material Design)

---

## 함께 사용하면 좋은 것들

- [컴포넌트 아키텍처](component-architecture.md) - 컴포넌트 패턴 및 Atomic Design
- [접근성 WCAG](accessibility-wcag.md) - WCAG 2.2 준수 및 테스트
- `moai-library-shadcn` - shadcn/ui 컴포넌트 라이브러리
- `moai-code-frontend` - 프론트엔드 아키텍처 패턴
- `moai-lang-unified` - TypeScript 모범 사례

---

## 공식 리소스

- W3C DTCG: https://designtokens.org
- WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
- Pencil MCP: https://docs.pencil.dev
- Style Dictionary: https://styledictionary.com
- Storybook: https://storybook.js.org

---

최종 업데이트: 2025-11-21
상태: 프로덕션 준비 완료
