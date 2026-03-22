# SPEC-MSW-001: 인라인 Mock 데이터를 MSW(Mock Service Worker)로 마이그레이션

## 메타데이터

| 항목 | 값 |
|------|------|
| SPEC ID | SPEC-MSW-001 |
| 제목 | Inline Mock to MSW Migration |
| 생성일 | 2026-03-22 |
| 상태 | Planned |
| 우선순위 | High |
| 라이프사이클 | spec-anchored |

---

## 1. Environment (환경)

### 1.1 현재 시스템 환경

- **프레임워크**: Next.js 16.2.1, App Router
- **런타임**: React 19.2.4, TypeScript 5.9.3
- **UI**: shadcn/ui + Tailwind CSS 4.1.12
- **패키지 매니저**: pnpm
- **상태 관리**: React Context + localStorage
- **라우팅**: `/` (메인 생성), `/history`, `/settings`

### 1.2 현재 Mock 아키텍처

- `lib/mock/generate.ts`의 `generateMockOutput()` 함수가 유일한 데이터 소스
- `setTimeout(2000)`으로 API 지연 시뮬레이션
- `GenerateResult` 타입으로 AI별 출력(chatgpt, gemini, claude) + historyItem 반환
- 프로젝트 내 `fetch()`, `axios`, HTTP 호출이 전혀 존재하지 않음
- `app/api/` 디렉토리 미존재
- `app/page.tsx`의 `handleGenerate()`에서 직접 함수 호출

### 1.3 데이터 흐름

```
사용자 입력 -> handleGenerate() -> generateMockOutput() -> useState 저장 -> OutputDataSection 렌더링
                                                        -> HistoryProvider (localStorage)
```

---

## 2. Assumptions (가정)

### 2.1 기술적 가정

| ID | 가정 | 신뢰도 | 검증 방법 |
|----|------|--------|----------|
| A1 | MSW v2.x가 Next.js 16 App Router와 호환됨 | Medium | Context7 문서 확인 + PoC |
| A2 | MSW browser worker가 `'use client'` 컴포넌트 환경에서 동작함 | Medium | MSW 공식 문서 + 브라우저 테스트 |
| A3 | Next.js App Router의 Route Handler가 MSW handler와 동일한 요청/응답 패턴을 사용 가능 | High | Next.js 공식 문서 |
| A4 | 기존 `GenerateResult` 타입이 API 응답 형태로 변환 가능 | High | 타입 분석 완료 |
| A5 | localStorage 기반 히스토리/설정 관리는 변경 불필요 | High | 클라이언트 상태이므로 API 계층과 독립 |

### 2.2 비즈니스 가정

| ID | 가정 | 신뢰도 | 검증 방법 |
|----|------|--------|----------|
| B1 | 향후 실제 AI API 통합이 예정됨 (tech.md 참조: "실제 API 통합은 향후 작업") | High | product.md, tech.md |
| B2 | MSW 마이그레이션으로 실제 API 전환 시 클라이언트 코드 변경 최소화 가능 | High | MSW 아키텍처 패턴 |

---

## 3. Requirements (요구사항)

### 3.1 Ubiquitous (시스템 전역 요구사항)

- **[REQ-U-001]** 시스템은 **항상** 모든 AI 생성 요청을 HTTP fetch API를 통해 수행해야 한다.
- **[REQ-U-002]** 시스템은 **항상** API 응답을 `GenerateResult` 타입과 호환되는 JSON 형식으로 반환해야 한다.
- **[REQ-U-003]** 시스템은 **항상** 개발 환경에서 MSW를 통해 네트워크 요청을 인터셉트하여 Mock 응답을 제공해야 한다.

### 3.2 Event-Driven (이벤트 기반 요구사항)

- **[REQ-E-001]** **WHEN** 사용자가 "생성" 버튼을 클릭 **THEN** `handleGenerate()`는 `POST /api/generate` 엔드포인트로 fetch 요청을 전송한다.
- **[REQ-E-002]** **WHEN** 개발 서버가 시작됨 **THEN** MSW browser worker가 자동으로 초기화되어 네트워크 인터셉트를 시작한다.
- **[REQ-E-003]** **WHEN** API 응답이 성공적으로 수신됨 **THEN** 응답 데이터가 파싱되어 기존과 동일하게 useState 및 HistoryProvider에 저장된다.

### 3.3 State-Driven (상태 기반 요구사항)

- **[REQ-S-001]** **IF** 환경이 development 모드 **THEN** MSW browser worker가 활성화되어 `/api/generate` 요청을 인터셉트한다.
- **[REQ-S-002]** **IF** 환경이 production 모드 **THEN** MSW worker가 로드되지 않으며, 실제 API 엔드포인트로 요청이 전달된다.
- **[REQ-S-003]** **IF** 환경이 test 모드 **THEN** MSW node server가 활성화되어 테스트용 Mock 응답을 제공한다.

### 3.4 Unwanted (금지 요구사항)

- **[REQ-N-001]** 시스템은 production 빌드에 MSW 관련 코드를 **포함하지 않아야 한다**.
- **[REQ-N-002]** 시스템은 `generateMockOutput()`을 클라이언트 컴포넌트에서 직접 호출**하지 않아야 한다** (마이그레이션 완료 후).
- **[REQ-N-003]** MSW handler는 실제 API 응답 스키마와 **불일치하지 않아야 한다**.

### 3.5 Optional (선택 요구사항)

- **[REQ-O-001]** **가능하면** Next.js App Router의 Route Handler(`app/api/generate/route.ts`)를 생성하여 향후 실제 API 통합의 기반을 제공한다.
- **[REQ-O-002]** **가능하면** MSW DevTools 또는 콘솔 로깅을 통해 인터셉트된 요청을 개발자가 확인할 수 있도록 한다.
- **[REQ-O-003]** **가능하면** 에러 시나리오(네트워크 오류, 타임아웃, 서버 오류)에 대한 MSW handler를 추가하여 에러 핸들링 테스트를 지원한다.

---

## 4. Specifications (기술 사양)

### 4.1 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| API Mocking | MSW (Mock Service Worker) | >=2.7.0 (latest stable) |
| HTTP 클라이언트 | fetch API (브라우저 내장) | - |
| API Route | Next.js Route Handler | Next.js 16 내장 |

### 4.2 아키텍처 설계

#### 마이그레이션 후 데이터 흐름

```
[Development 환경]
사용자 입력 -> handleGenerate() -> fetch('/api/generate') -> MSW 인터셉트 -> Mock 응답 반환

[Production 환경]
사용자 입력 -> handleGenerate() -> fetch('/api/generate') -> 실제 API 서버 -> 실제 응답 반환

[Test 환경]
테스트 코드 -> fetch('/api/generate') -> MSW node server -> Mock 응답 반환
```

#### 디렉토리 구조 (신규/변경)

```
app/
  api/
    generate/
      route.ts              [신규] Route Handler (Optional - REQ-O-001)
lib/
  api/
    generate.ts             [신규] fetch 기반 API 클라이언트 함수
  mock/
    generate.ts             [유지] 기존 Mock 로직 (MSW handler에서 재사용)
    handlers.ts             [신규] MSW request handler 정의
    browser.ts              [신규] MSW browser worker 설정
    node.ts                 [신규] MSW node server 설정 (테스트용)
  msw/
    mockServiceWorker.js    [신규] MSW 서비스 워커 (자동 생성)
app/
  page.tsx                  [변경] generateMockOutput() -> fetch API 호출로 교체
```

### 4.3 API 계약

#### POST /api/generate

**Request:**
```typescript
interface GenerateRequest {
  chatgpt: AIProvider
  gemini: AIProvider
  claude: AIProvider
  systemPrompt: string
  userPrompt: string
  schema: string
  inputFields: { id: string; label: string; value: string }[]
}
```

**Response (200 OK):**
```typescript
interface GenerateResponse {
  chatgptOutput?: AIOutput
  geminiOutput?: AIOutput
  claudeOutput?: AIOutput
  historyItem: HistoryItem
}
```

---

## 5. Traceability (추적성)

| 요구사항 | 구현 파일 | 검증 방법 |
|---------|----------|----------|
| REQ-U-001 | `lib/api/generate.ts` | fetch 호출 확인 |
| REQ-U-002 | `lib/mock/handlers.ts` | 응답 타입 검증 |
| REQ-U-003 | `lib/mock/browser.ts` | MSW 초기화 확인 |
| REQ-E-001 | `app/page.tsx` | E2E 테스트 |
| REQ-E-002 | `app/layout.tsx` or entry | MSW 시작 로그 확인 |
| REQ-S-001 | `lib/mock/browser.ts` | 환경 분기 테스트 |
| REQ-S-002 | Production 빌드 | 번들 분석 |
| REQ-N-001 | next.config.ts | 번들 사이즈 확인 |
| REQ-O-001 | `app/api/generate/route.ts` | Route Handler 동작 |
