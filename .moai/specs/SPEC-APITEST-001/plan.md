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
| 1.0.0 | 2026-06-07 | hw | 초기 구현 계획 작성 |

# SPEC-APITEST-001 구현 계획 (Implementation Plan)

## 1. 기술 접근 방식 (Technical Approach)

- 키 노출 방지를 위해 모든 제공자 호출은 신규 서버 라우트 `app/api/test-key/route.ts`에서 수행한다. 클라이언트는 카드의 현재 `apiKey`(`useAIConfig`)를 본문에 담아 자신의 서버(same-origin)로만 전송한다.
- **빠른 검증(quick)**: 제공자별 무토큰 인증 엔드포인트를 `fetch`로 직접 호출하는 경량 어댑터를 구현한다(LangChain 불필요). HTTP 2xx면 키 유효, 401/403이면 무효, 429면 rate limit로 분류.
- **실제 핑(ping)**: 기존 `ai-provider-factory.ts`의 모델 인스턴스 생성 로직을 재사용하되, 모델별로 단일 인스턴스를 만들어 `model.invoke("Hi")`를 호출한다. 결과 수집은 `analysis-chain.ts`의 `Promise.allSettled` + `{ success, error }` 패턴을 그대로 따른다.
- 결과는 React 컴포넌트 로컬 상태(`useState`)로만 보관하여 새로고침 시 소실되게 한다(DB 미사용).

## 2. 작업 분해 (Task Decomposition)

### 2.1 서버 (API 라우트 / 어댑터)

- T1. `app/api/test-key/route.ts` 신규 생성 — POST 핸들러, 요청 검증(Zod), 모드 분기, 응답 계약 구현 (`app/api/generate/route.ts` 패턴 차용)
- T2. 제공자별 빠른 검증 어댑터 (quick mode): OpenAI `GET /v1/models`, Gemini `ListModels`, Anthropic `GET /v1/models` 호출 + 응답 코드 → `keyValid`/`keyError` 매핑
- T3. 실제 핑 어댑터 (ping mode): 모델별 LangChain 인스턴스 생성 → `invoke("Hi")` → 지연시간/미리보기/에러 수집, 호출당 타임아웃 + 동시성 상한 적용

### 2.2 클라이언트 (설정 UI 확장 — `app/settings/`)

- T4. 모드 토글(빠른 검증 / 실제 핑) 컴포넌트 추가 (테스트 실행 단위)
- T5. 제공자별 모델 체크박스 리스트 추가 (`lib/constants/ai-models.ts`의 `*_MODELS` 기반, quick 모드에서 비활성)
- T6. "테스트" 버튼 + 로딩 상태(`Loader2`) + 진행 중 비활성/중복 차단
- T7. 인라인 결과 렌더링: 키 유효성 `Badge`, 핑 모드 모델별 행(상태 배지/지연시간/미리보기/에러)
- T8. 오류/성공 `sonner` toast 연동

## 3. 파일 목록 (File List)

| 경로 | 작업 | 비고 |
|------|------|------|
| `app/api/test-key/route.ts` | 신규 | POST 라우트 핸들러 (특수 파일, prefix 없음) |
| `app/api/test-key/_validate.ts` | 신규(권장) | Zod 요청 스키마 (`_` prefix 규칙) |
| `app/api/test-key/_adapters.ts` | 신규(권장) | 제공자별 quick/ping 어댑터 (`_` prefix 규칙) |
| `app/settings/page.tsx` | 수정 | `ProviderCard`에 모드 토글/체크박스/버튼/결과 추가 |
| `app/settings/_components/` | 신규(권장) | 카드 하위 컴포넌트 분리 (`_` prefix 규칙) |
| `lib/constants/ai-models.ts` | 참조만 | 체크박스 소스 (수정 없음) |
| `lib/langchain/ai-provider-factory.ts` | 참조/재사용 | 모델 인스턴스 생성 패턴 |
| `lib/langchain/analysis-chain.ts` | 참조 | `{ success, error }` + `allSettled` 패턴 |
| `src/db/schema.ts` | 미변경 | 영속화 없음 |

> 참고: `app/` 내부 비특수 파일/폴더는 `.claude/rules/nextjs-naming.md`에 따라 `_` prefix를 적용한다(`route.ts`/`page.tsx`는 특수 파일이므로 prefix 없음).

## 4. 의존성 (Dependencies)

- 신규 프로덕션 의존성 없음. 기존 설치된 `@langchain/openai`, `@langchain/google-genai`, `@langchain/anthropic`, `zod`, `sonner`, `lucide-react`, shadcn/ui 재사용.
- shadcn `Checkbox`, `Badge` 컴포넌트가 레포에 존재하는지 확인 필요(없으면 shadcn add).

## 5. 마일스톤 (우선순위 기반 — 시간 추정 없음)

- **1차 목표 (Priority High)**: T1, T2 — 서버 라우트 + 빠른 검증 어댑터 (키 유효성 검증 end-to-end 동작)
- **2차 목표 (Priority High)**: T6, T7(키 배지 부분), T4 — 설정 UI에서 빠른 검증 실행 및 인라인 배지 표시
- **3차 목표 (Priority Medium)**: T3, T5, T7(모델 행) — 실제 핑 모드 + 모델 체크박스 + 모델별 결과 행
- **최종 목표 (Priority Medium)**: T8 + 비정상 동작 처리(타임아웃/rate limit/부분 실패) 다듬기
- **선택 목표 (Priority Low)**: 결과 영역 접근성(ARIA) 및 응답 미리보기 길이 조정

> 의존성: T1 완료 후 T2/T3 진행. T2 완료 후 UI(2차 목표) 진행.

## 6. 리스크 및 대응 (Risks & Mitigation)

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 핑 모드 토큰 비용 | 사용자 비용 발생 | 모드 토글 명시 + "Hi" 최소 프롬프트, 체크된 모델만 호출 |
| Rate limit (429) | 다중 모델 동시 호출 시 차단 | 동시성 상한 적용, 429를 별도 메시지로 구분 |
| 키 유출(클라이언트 호출 시) | 보안 사고 | 모든 제공자 호출을 서버 라우트로 강제(same-origin POST) |
| 호출 행(hang) | UI 멈춤 | 호출당 타임아웃(AbortController) 적용 |
| 부분 실패 | 전체 실패로 오인 | `Promise.allSettled`로 모델별 독립 결과 수집 |
| 키 평문 노출 | 정보 노출 | 결과/로그에 키 미출력, 응답에 키 미포함 |
