---
paths: "**/*.ts,**/*.tsx,**/tsconfig.json"
---

# TypeScript 규칙

버전: TypeScript 5.9+

## 도구

- 린팅: ESLint 9 또는 Biome
- 포매팅: Prettier 또는 Biome
- 테스팅: Vitest 또는 Jest
- 패키지 관리: pnpm 또는 npm

## 필수 사항

- tsconfig.json에서 strict 모드를 활성화할 것
- 내보내는 함수에는 명시적 반환 타입을 사용할 것
- 런타임 유효성 검사에 Zod를 사용할 것
- 리터럴에는 const assertion을 우선 사용할 것
- 상태 관리에 discriminated union을 사용할 것
- 모든 Promise 거부(rejection)를 처리할 것

## 금지 사항

- any 타입 사용 금지 (대신 unknown 사용)
- 설명 없는 @ts-ignore 사용 금지
- 변경 가능한(mutable) 변수 내보내기 금지
- 유효성 검사 없는 non-null assertion (!) 사용 금지
- tsconfig에서 strict 검사 비활성화 금지
- async/await와 .then() 체인 혼용 금지

## 파일 규칙

- 테스트 파일은 *.test.ts 또는 *.spec.ts
- barrel export에는 index.ts 사용
- 컴포넌트(*.tsx)에는 PascalCase 사용
- 유틸리티에는 camelCase 사용
- 파일 이름에는 kebab-case 사용

## 테스팅

- 빠른 단위 테스트에 Vitest 사용
- 컴포넌트 테스트에 Testing Library 사용
- 모듈 모킹에 vi.mock() 또는 jest.mock() 사용
- API 모킹에 msw 사용

## React 관련 (해당되는 경우)

- 기본적으로 React 19 Server Components 사용
- 클래스 컴포넌트보다 함수 컴포넌트를 우선 사용
- 비용이 큰 렌더링에는 React.memo() 사용
- Context 또는 상태 라이브러리를 활용하여 prop drilling 방지
