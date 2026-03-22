# SPEC-MSW-001: 인수 조건

## 메타데이터

| 항목 | 값 |
|------|------|
| SPEC ID | SPEC-MSW-001 |
| 제목 | Inline Mock to MSW Migration - Acceptance Criteria |
| 관련 SPEC | SPEC-MSW-001/spec.md |

---

## 1. 기능 검증 시나리오

### AC-001: fetch 기반 생성 요청 (REQ-U-001, REQ-E-001)

```gherkin
Scenario: 사용자가 AI 생성을 요청하면 fetch API를 통해 데이터를 수신한다

  Given 개발 환경에서 앱이 실행 중이고 MSW worker가 초기화된 상태
  And 최소 1개의 AI 모델(chatgpt, gemini, claude)이 활성화된 상태
  And 시스템 프롬프트와 사용자 프롬프트가 입력된 상태

  When 사용자가 "생성" 버튼을 클릭

  Then handleGenerate()가 POST /api/generate 엔드포인트로 fetch 요청을 전송
  And 응답이 GenerateResponse 타입과 일치하는 JSON으로 수신됨
  And AI별 출력 데이터가 OutputDataSection에 렌더링됨
  And 히스토리 아이템이 HistoryProvider에 저장됨
```

### AC-002: MSW 자동 초기화 (REQ-E-002, REQ-S-001)

```gherkin
Scenario: 개발 서버 시작 시 MSW browser worker가 자동 초기화된다

  Given NODE_ENV가 "development"인 환경

  When pnpm dev로 개발 서버를 시작

  Then MSW browser worker가 자동으로 등록됨
  And 브라우저 콘솔에 "[MSW] Mocking enabled" 메시지가 출력됨
  And /api/generate 요청이 MSW에 의해 인터셉트됨
```

### AC-003: Production 환경 MSW 미포함 (REQ-N-001, REQ-S-002)

```gherkin
Scenario: Production 빌드에 MSW 관련 코드가 포함되지 않는다

  Given NODE_ENV가 "production"인 환경

  When pnpm build를 실행

  Then 빌드가 성공적으로 완료됨
  And .next/static/ 번들에 MSW 관련 코드가 포함되지 않음
  And mockServiceWorker.js가 서비스 워커로 등록되지 않음
```

### AC-004: 기존 기능 회귀 없음 (REQ-E-003)

```gherkin
Scenario: 마이그레이션 후 기존 생성 기능이 동일하게 동작한다

  Given MSW 기반으로 마이그레이션이 완료된 상태

  When 3개 AI 모델 모두 활성화하고 생성을 실행

  Then chatgptOutput, geminiOutput, claudeOutput 모두 데이터 포함
  And 각 출력의 data 필드에 '문서 제목', '작성일', '요약' 등의 키 존재
  And historyItem이 생성되어 히스토리 페이지에서 조회 가능
  And 생성 완료 토스트 메시지가 표시됨
```

### AC-005: 직접 함수 호출 제거 (REQ-N-002)

```gherkin
Scenario: 클라이언트 코드에서 generateMockOutput 직접 호출이 제거된다

  Given 마이그레이션이 완료된 상태

  When app/page.tsx 코드를 검사

  Then generateMockOutput의 import 구문이 존재하지 않음
  And handleGenerate()가 lib/api/generate.ts의 함수를 사용
  And 모든 데이터 요청이 fetch API를 통해 수행됨
```

---

## 2. 에러 핸들링 시나리오

### AC-006: 네트워크 에러 처리 (REQ-O-003)

```gherkin
Scenario: API 요청 실패 시 사용자에게 에러 메시지를 표시한다

  Given 개발 환경에서 앱이 실행 중인 상태

  When fetch 요청이 네트워크 오류로 실패

  Then 에러 토스트 메시지가 표시됨
  And isGenerating 상태가 false로 복원됨
  And 이전 생성 결과가 유지됨 (덮어쓰지 않음)
```

---

## 3. 환경별 동작 시나리오

### AC-007: 테스트 환경 MSW node server (REQ-S-003)

```gherkin
Scenario: 테스트 환경에서 MSW node server로 API를 Mock한다

  Given 테스트 환경 (vitest 또는 jest)

  When lib/mock/node.ts의 server가 beforeAll에서 시작됨
  And 테스트 코드에서 fetch('/api/generate')를 호출

  Then MSW node server가 요청을 인터셉트
  And handlers.ts에 정의된 Mock 응답이 반환됨
  And 실제 네트워크 요청이 발생하지 않음
```

---

## 4. Quality Gate 기준

### 4.1 코드 품질

| 항목 | 기준 |
|------|------|
| TypeScript 타입 오류 | 0건 |
| ESLint 오류 | 0건 |
| Production 빌드 | 성공 |
| MSW 코드 번들 포함 | 불포함 (production) |

### 4.2 기능 완전성

| 항목 | 기준 |
|------|------|
| AI 생성 기능 | fetch 기반으로 동작 |
| 히스토리 저장 | 기존과 동일하게 동작 |
| 설정 관리 | 변경 없이 동작 |
| 에러 핸들링 | 네트워크 오류 시 토스트 표시 |

### 4.3 아키텍처 준수

| 항목 | 기준 |
|------|------|
| 직접 함수 호출 제거 | `generateMockOutput` import 0건 (page.tsx) |
| API 클라이언트 분리 | `lib/api/generate.ts` 존재 |
| MSW handler 정의 | `lib/mock/handlers.ts` 존재 |
| 환경 분기 | development/production/test 분리 |

---

## 5. Definition of Done

- [x] MSW v2가 devDependencies로 설치됨
- [x] `public/mockServiceWorker.js` 생성됨
- [x] `lib/mock/handlers.ts` - POST /api/generate handler 구현됨
- [x] `lib/mock/browser.ts` - browser worker 설정됨
- [x] `lib/mock/node.ts` - node server 설정됨
- [x] `lib/api/generate.ts` - fetch 기반 API 클라이언트 구현됨
- [x] `app/page.tsx` - fetch 기반 호출로 교체됨
- [x] MSW Provider가 개발 환경에서 자동 초기화됨
- [x] Production 빌드 성공 (MSW 코드 미포함)
- [x] 기존 생성/히스토리 기능 정상 동작 확인
- [x] TypeScript 컴파일 오류 0건
