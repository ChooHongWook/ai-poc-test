---
paths: "**/*.js,**/*.mjs,**/*.cjs,**/package.json"
---

# JavaScript 규칙

버전: ES2024+ / Node.js 22 LTS

## 도구

- 린팅: ESLint 9 또는 Biome
- 포맷팅: Prettier 또는 Biome
- 테스트: Vitest 또는 Jest
- 런타임: Node.js, Bun 1.x, 또는 Deno 2.x

## 필수 사항

- CommonJS 대신 ESM 모듈 사용
- 비동기 작업에는 async/await 사용
- 옵셔널 체이닝(?.)과 널 병합 연산자(??) 사용
- 시스템 경계에서 사용자 입력 검증
- 기본적으로 const 사용, 재할당이 필요한 경우에만 let 사용
- 모든 Promise 거부(rejection) 처리

## 금지 사항

- var 사용 금지 (const/let 사용)
- == 비교 연산자 사용 금지 (=== 사용)
- 처리되지 않은 Promise 거부 방치 금지
- eval() 또는 Function() 생성자 사용 금지
- 함수 인자 직접 변경 금지
- 비동기 컨텍스트에서 동기 파일 I/O 사용 금지

## 파일 규칙

- 테스트 파일은 *.test.js 또는 *.spec.js
- 배럴 내보내기는 index.js
- 함수와 변수는 camelCase 사용
- 클래스는 PascalCase 사용
- 파일 이름은 kebab-case 사용

## 테스트

- 최신 프로젝트에는 Vitest 사용
- UI 컴포넌트에는 Testing Library 사용
- 모듈 모킹은 vi.mock() 또는 jest.mock() 사용
- HTTP 모킹에는 msw 사용
