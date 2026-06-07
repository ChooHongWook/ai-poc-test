---
id: SPEC-APITEST-001
version: "1.0.0"
status: draft
created: "2026-06-07"
updated: "2026-06-07"
author: hw
priority: P2
issue_number: 0
---

## HISTORY

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2026-06-07 | hw | 초기 작성 (API Key & Model 테스트 기능 명세) |

# SPEC-APITEST-001: 설정 페이지 API Key & Model 테스트 기능

## 1. 환경 (Environment)

### 1.1 현재 상태

- `app/settings/page.tsx`는 chatgpt/gemini/claude 3개 제공자에 대해 `ProviderCard`를 렌더링한다. 각 카드는 `Switch`(활성화) + API Key `password Input` + 모델명 텍스트 `Input`으로 구성된다.
- 제공자 상태(`enabled`, `apiKey`, `model`)는 `useAIConfig()` 컨텍스트(AIConfigProvider)로 관리되며 localStorage에 영속화된다.
- API Key의 유효성이나 모델의 실제 응답 가능 여부를 검증할 수단이 현재 UI에 존재하지 않는다. 사용자는 키를 입력해도 그 키가 올바른지, 선택한 모델이 실제로 호출 가능한지 알 수 없다.
- `lib/constants/ai-models.ts`에 제공자별 모델 목록(`OPENAI_MODELS`, `GEMINI_MODELS`, `CLAUDE_MODELS`)이 정의되어 있다.
- `lib/langchain/ai-provider-factory.ts`의 `createProviders(config)`는 `ChatOpenAI` / `ChatGoogleGenerativeAI` / `ChatAnthropic` 인스턴스를 생성하는 단일 진입점이다(`@MX:ANCHOR`).
- `lib/langchain/analysis-chain.ts`는 `try/catch` 기반으로 `{ success, error }` 형태의 결과를 반환하는 확립된 에러 처리 패턴을 가진다.

### 1.2 목표 상태

- 각 `ProviderCard`에서 사용자가 현재 입력한 API Key의 유효성을 검증하고, 사용자가 선택한 모델 부분 집합에 대해 실제 호출 테스트를 수행할 수 있다.
- 두 가지 테스트 모드(빠른 검증 / 실제 핑)를 사용자가 테스트 실행 단위로 선택할 수 있다.
- 테스트 결과는 해당 제공자 카드 내부에 인라인으로(transient) 표시되며 DB에 영속화되지 않는다. 페이지 새로고침 시 결과는 소실된다.
- 실제 제공자 호출은 모두 서버 사이드(신규 `app/api/test-key/route.ts`)에서 수행하여 API Key가 크로스 오리진으로 노출되지 않도록 한다.

### 1.3 기술 스택

- 신규 라우트: `app/api/test-key/route.ts` (`app/api/generate/route.ts` 패턴 차용, POST)
- LangChain: 기존 설치된 `@langchain/openai`, `@langchain/google-genai`, `@langchain/anthropic` 재사용 (실제 핑 모드)
- 제공자 인증 검증(빠른 검증 모드): 각 제공자의 인증/목록 엔드포인트 직접 호출
  - OpenAI: `GET https://api.openai.com/v1/models`
  - Google Gemini: `ListModels` 엔드포인트 (`GET https://generativelanguage.googleapis.com/v1beta/models?key=...`)
  - Anthropic: `GET https://api.anthropic.com/v1/models`
- UI: shadcn/ui + Tailwind, `sonner`(toast), `lucide-react`(`Loader2` 스피너), `Card`/`Button`/`Switch`/`Checkbox`/`Badge`/`Input`/`Label`
- 신규 프로덕션 의존성 추가는 예상하지 않음(기존 SDK 재사용)

## 2. 가정 (Assumptions)

- **A1**: 테스트 대상 키는 항상 제공자 카드에 현재 입력된 값(localStorage 출처, `useAIConfig` 컨텍스트)이며 환경변수(`app/api/env-keys/route.ts`)는 사용하지 않는다. (확정됨)
- **A2**: 각 제공자의 무토큰 인증 엔드포인트(models list)는 키 유효성 판정에 충분히 신뢰할 수 있다. (신뢰도: 중 — 잠정 가정 참조)
- **A3**: 실제 핑 모드에서 `model.invoke("Hi")` 호출은 소량의 토큰 비용을 발생시키며, 사용자가 이를 인지하고 모드를 선택한다. (확정됨)
- **A4**: 테스트 결과는 DB에 저장하지 않으며 마이그레이션이나 스키마 변경이 발생하지 않는다(`src/db/schema.ts` 미변경). (확정됨)
- **A5**: 빠른 검증 모드에서는 모델 체크박스가 무의미하므로 비활성화/무시된다. (확정됨)

## 3. 요구사항 (Requirements - EARS)

> 요구사항은 5개 모듈로 한정한다. 각 모듈은 EARS 패턴으로 표기한다.

### 3.1 REQ-APITEST-01: 테스트 단위 및 모델 선택 (Ubiquitous)

- 시스템은 **항상** 각 제공자 카드 내에 해당 제공자의 모델 목록(`OPENAI_MODELS` / `GEMINI_MODELS` / `CLAUDE_MODELS` 기반)을 체크박스 리스트로 표시해야 한다.
- 시스템은 **항상** 테스트 단위로 "API Key 검증" + "사용자가 체크한 모델 부분 집합 테스트"를 함께 제공해야 한다.
- 시스템은 **항상** 테스트에 사용할 API Key를 해당 카드에 입력된 현재 값(`useAIConfig` 컨텍스트)에서 가져와야 한다.

### 3.2 REQ-APITEST-02: 테스트 모드 선택 (Optional)

- **가능하면** 시스템은 테스트 실행 단위로 두 가지 모드 중 하나를 선택하는 토글을 제공해야 한다.
  - **빠른 검증(auth-only)**: 제공자의 무토큰 인증/목록 엔드포인트를 호출하여 API Key 유효성만 검증한다. 토큰 비용이 없으며 이 모드에서 모델 체크박스는 비활성화된다.
  - **실제 핑(real ping)**: 체크된 각 모델에 대해 기존 LangChain 경로로 최소 프롬프트("Hi")로 `model.invoke()`를 호출한다. 소량의 토큰 비용이 발생하며 모델별 성공/실패, 지연시간(ms), 짧은 응답 미리보기를 수집한다.

### 3.3 REQ-APITEST-03: 테스트 실행 이벤트 처리 (Event-driven)

- **WHEN** 사용자가 제공자 카드의 "테스트" 버튼을 클릭하면 **THEN** 시스템은 `{ provider, apiKey, mode, models[] }`를 본문으로 하여 서버 라우트 `app/api/test-key/route.ts`에 POST 요청을 전송해야 한다.
- **WHEN** 서버가 응답을 반환하면 **THEN** 시스템은 해당 카드 내에 인라인으로 결과를 렌더링해야 한다.
  - 모든 모드: 제공자별 키 유효성 배지(유효/무효)
  - 핑 모드: 모델별 행(상태 배지 success/fail, 지연시간 ms, 응답 미리보기, 실패 시 에러 메시지)
- **WHEN** 실제 제공자 호출이 수행되면 **THEN** 호출은 반드시 서버 사이드에서 실행되어 API Key가 브라우저에서 외부 도메인으로 직접 노출되지 않아야 한다.

### 3.4 REQ-APITEST-04: 테스트 진행 중 상태 (State-driven)

- **IF** 테스트가 진행 중이면 **THEN** 시스템은 해당 카드의 "테스트" 버튼을 비활성화하고 로딩 스피너(`Loader2`)를 표시해야 한다.
- **IF** 테스트가 진행 중이면 **THEN** 시스템은 동일 카드의 중복 테스트 실행을 차단해야 한다.
- **IF** 제공자의 `enabled`가 false이거나 `apiKey`가 비어 있으면 **THEN** 시스템은 "테스트" 버튼을 비활성화해야 한다.

### 3.5 REQ-APITEST-05: 비정상 동작 처리 (Unwanted behavior)

- **IF** API Key가 유효하지 않으면(인증 실패) **THEN** 시스템은 키 유효성 배지를 "무효"로 표시하고 에러 메시지를 노출해야 한다.
- **IF** 네트워크 오류 또는 타임아웃이 발생하면 **THEN** 시스템은 결과를 실패로 처리하고 사용자에게 명확한 오류 메시지(toast 포함)를 표시해야 한다.
- **IF** 제공자가 rate limit(429)을 반환하면 **THEN** 시스템은 해당 결과를 실패로 표시하고 rate limit임을 구분 가능한 메시지로 안내해야 한다.
- **IF** 핑 모드에서 일부 모델만 실패하면 **THEN** 시스템은 부분 실패를 허용하고 성공/실패 모델을 각각의 행으로 구분 표시해야 한다(전체 실패로 처리하지 않는다).
- 시스템은 API Key를 결과 표시나 로그에 평문으로 출력**하지 않아야 한다**.
- 시스템은 테스트 결과를 DB에 저장**하지 않아야 한다**.

## 4. 명세 (Specifications)

### 4.1 서버 라우트 계약 (`app/api/test-key/route.ts`)

- 요청 본문: `{ provider: 'chatgpt'|'gemini'|'claude', apiKey: string, mode: 'quick'|'ping', models: string[] }`
- 응답 본문:
  - 공통: `{ keyValid: boolean, keyError?: string }`
  - 핑 모드: `{ keyValid, results: Array<{ model: string, success: boolean, latencyMs: number, preview?: string, error?: string }> }`
- 에러 처리는 `analysis-chain.ts`의 `{ success, error }` 형태를 따른다.

### 4.2 모드별 동작

- **quick**: 제공자 인증 엔드포인트 1회 호출 → `keyValid` 판정. `models`는 무시.
- **ping**: 키 유효성 확인 후, 체크된 각 모델에 대해 `model.invoke("Hi")` 수행. 모델별 결과를 `Promise.allSettled`로 수집(부분 실패 허용, `analysis-chain.ts` 패턴 준수).

### 4.3 비기능 요구

- 호출당 타임아웃을 적용한다(상세 값은 acceptance.md 참조).
- 핑 모드의 다중 모델 호출은 동시성 상한을 적용한다(상세 값은 acceptance.md 참조).

## 5. 추적성 (Traceability)

| 요구사항 | 구현 대상(예정) | 인수 시나리오 |
|----------|-----------------|----------------|
| REQ-APITEST-01 | `_components` 모델 체크박스 리스트, `ai-models.ts` 참조 | AC-1, AC-3 |
| REQ-APITEST-02 | 모드 토글 컴포넌트 | AC-1, AC-3 |
| REQ-APITEST-03 | `app/api/test-key/route.ts`, 카드 결과 렌더링 | AC-1, AC-2, AC-3 |
| REQ-APITEST-04 | 카드 로딩/비활성 상태 | AC-1, AC-3 |
| REQ-APITEST-05 | 서버 라우트 에러 처리, 배지/행 렌더링 | AC-2, AC-3, AC-4 |

- 관련 SPEC: SPEC-UPLOAD-001 (LangChain 파이프라인 패턴 공유)
