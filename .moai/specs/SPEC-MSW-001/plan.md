# SPEC-MSW-001: 구현 계획

## 메타데이터

| 항목 | 값 |
|------|------|
| SPEC ID | SPEC-MSW-001 |
| 제목 | Inline Mock to MSW Migration - Implementation Plan |
| 관련 SPEC | SPEC-MSW-001/spec.md |

---

## 1. 구현 전략

### 1.1 마이그레이션 접근 방식

**점진적 마이그레이션 (Strangler Fig Pattern)** 채택:

1. MSW 인프라를 먼저 설정
2. 새로운 fetch 기반 API 클라이언트 생성
3. 기존 `generateMockOutput()` 로직을 MSW handler로 이관
4. `app/page.tsx`의 호출부를 fetch 기반으로 교체
5. 기존 직접 호출 코드 제거

이 접근 방식은 각 단계에서 기존 기능이 유지되므로 안전한 마이그레이션을 보장한다.

---

## 2. 마일스톤

### Phase 1: MSW 인프라 설정 (Primary Goal)

**목표**: MSW v2 설치 및 기본 설정 완료

| 작업 | 대상 파일 | 설명 |
|------|----------|------|
| 1-1 | `package.json` | `msw` 패키지 devDependencies 설치 |
| 1-2 | `public/mockServiceWorker.js` | `npx msw init public/` 실행으로 서비스 워커 생성 |
| 1-3 | `lib/mock/handlers.ts` | MSW request handler 정의 (`POST /api/generate`) |
| 1-4 | `lib/mock/browser.ts` | MSW browser worker 설정 (`setupWorker`) |
| 1-5 | `lib/mock/node.ts` | MSW node server 설정 (`setupServer`, 테스트용) |

**완료 기준**: MSW worker가 브라우저 콘솔에 `[MSW] Mocking enabled` 출력

### Phase 2: API 클라이언트 계층 생성 (Primary Goal)

**목표**: fetch 기반 API 호출 함수 작성

| 작업 | 대상 파일 | 설명 |
|------|----------|------|
| 2-1 | `lib/api/generate.ts` | `generateOutput()` 함수 - fetch 기반 API 클라이언트 |
| 2-2 | `lib/types.ts` | `GenerateRequest`, `GenerateResponse` 타입 추가 (필요 시) |

**완료 기준**: `generateOutput()` 함수가 `POST /api/generate`로 요청하고 타입 안전한 응답 반환

### Phase 3: MSW Handler 구현 (Primary Goal)

**목표**: 기존 Mock 로직을 MSW handler로 이관

| 작업 | 대상 파일 | 설명 |
|------|----------|------|
| 3-1 | `lib/mock/handlers.ts` | `generateMockOutput()` 로직을 MSW handler 내부로 이동 |
| 3-2 | `lib/mock/generate.ts` | 기존 파일 유지 (MSW handler에서 import하여 재사용) |

**설계 결정**: 기존 `generateMockOutput()` 함수를 삭제하지 않고, MSW handler 내에서 재사용한다. 이를 통해:
- 기존 로직의 검증된 동작을 보존
- MSW handler의 복잡도를 최소화
- 향후 실제 API 전환 시 handler만 교체하면 됨

**완료 기준**: MSW가 `/api/generate` 요청을 인터셉트하여 기존과 동일한 Mock 데이터 반환

### Phase 4: 클라이언트 코드 마이그레이션 (Secondary Goal)

**목표**: `app/page.tsx`의 직접 함수 호출을 fetch 호출로 교체

| 작업 | 대상 파일 | 설명 |
|------|----------|------|
| 4-1 | `app/page.tsx` | `generateMockOutput()` import 제거, `generateOutput()` 사용 |
| 4-2 | `app/page.tsx` | 에러 핸들링 추가 (네트워크 오류, HTTP 상태 코드) |

**완료 기준**: 생성 기능이 fetch API를 통해 동작하며 기존과 동일한 UX 제공

### Phase 5: MSW 초기화 통합 (Secondary Goal)

**목표**: 개발 환경에서 MSW가 자동으로 초기화되도록 설정

| 작업 | 대상 파일 | 설명 |
|------|----------|------|
| 5-1 | `lib/mock/index.ts` | MSW 초기화 진입점 (환경 분기) |
| 5-2 | `app/layout.tsx` 또는 전용 Provider | MSW Provider 또는 동적 import로 초기화 |
| 5-3 | `next.config.ts` | production 빌드에서 MSW 코드 제외 설정 (필요 시) |

**설계 결정**: Next.js App Router에서 MSW 초기화는 클라이언트 컴포넌트에서 수행해야 한다. `'use client'` Provider 컴포넌트를 생성하여 `layout.tsx`에 포함시킨다.

**완료 기준**: `pnpm dev` 실행 시 MSW가 자동 초기화, `pnpm build` 시 MSW 코드 미포함

### Phase 6: Route Handler 생성 (Optional Goal)

**목표**: 향후 실제 API 전환을 위한 Next.js Route Handler 기반 마련

| 작업 | 대상 파일 | 설명 |
|------|----------|------|
| 6-1 | `app/api/generate/route.ts` | Route Handler 스켈레톤 (현재는 mock 데이터 반환) |

**완료 기준**: `/api/generate` Route Handler가 존재하고, MSW 비활성화 시에도 동작

---

## 3. 기술적 접근

### 3.1 MSW v2 설정 패턴

```
MSW v2 핵심 구조:
- handlers: 요청 패턴 매칭 및 응답 정의
- browser: setupWorker(handlers) - 브라우저 환경
- node: setupServer(handlers) - Node.js/테스트 환경
- handlers는 공유하여 브라우저/노드 모두에서 동일한 Mock 동작 보장
```

### 3.2 Next.js App Router 통합 고려사항

- **서비스 워커 파일 위치**: `public/mockServiceWorker.js` (Next.js static serving)
- **초기화 시점**: 클라이언트 사이드 `useEffect` 또는 동적 import
- **환경 분기**: `process.env.NODE_ENV` 또는 `NEXT_PUBLIC_MSW_ENABLED` 환경 변수
- **Tree-shaking**: MSW import를 동적 import로 감싸 production 번들에서 제외

### 3.3 타입 안전성 전략

- `GenerateRequest`/`GenerateResponse` 타입을 공유하여 클라이언트-handler 간 타입 일관성 유지
- MSW handler에서 `HttpResponse.json<GenerateResponse>()` 제네릭으로 응답 타입 강제
- Zod 스키마 도입은 이 SPEC 범위 외 (향후 REQ-O로 확장 가능)

---

## 4. 리스크 분석

### 4.1 기술적 리스크

| ID | 리스크 | 영향도 | 발생 확률 | 대응 전략 |
|----|--------|--------|----------|----------|
| R1 | MSW v2와 Next.js 16 호환성 문제 | High | Low | Context7 문서 확인, PoC 선행 실행 |
| R2 | Service Worker 등록 실패 (HTTPS 필요) | Medium | Low | localhost는 예외, 개발 환경 확인 |
| R3 | MSW 초기화 타이밍 이슈 (fetch가 MSW 준비 전 실행) | High | Medium | MSW 초기화 Promise를 await한 후 앱 렌더링 |
| R4 | Production 빌드에 MSW 코드 포함 | High | Medium | 동적 import + 환경 변수 분기로 tree-shaking 보장 |
| R5 | 기존 기능 회귀 | High | Low | 마이그레이션 각 단계별 수동 검증 |

### 4.2 대응 전략 상세

**R3 (초기화 타이밍)**: MSW 초기화가 완료될 때까지 앱 렌더링을 지연시키는 패턴 적용. `MSWProvider` 컴포넌트에서 `useState(false)` -> MSW 초기화 후 `setState(true)` -> children 렌더링.

**R4 (번들 포함 방지)**: `next.config.ts`에서 webpack alias를 통해 production 환경에서 MSW 모듈을 빈 모듈로 대체하거나, 순수하게 동적 import와 환경 변수 분기로 처리.

---

## 5. 아키텍처 설계 방향

### 5.1 계층 구조

```
[UI Layer]          app/page.tsx (handleGenerate)
     |
[API Client Layer]  lib/api/generate.ts (fetch 추상화)
     |
[Network Layer]     fetch('/api/generate')
     |
[Intercept Layer]   MSW browser worker (개발) / 실제 서버 (프로덕션)
     |
[Handler Layer]     lib/mock/handlers.ts (MSW) / app/api/generate/route.ts (Next.js)
     |
[Logic Layer]       lib/mock/generate.ts (기존 Mock 로직 재사용)
```

### 5.2 Expert 상담 권장

이 SPEC의 구현 시 다음 Expert 상담을 권장합니다:

- **expert-frontend**: MSW + Next.js App Router 통합 패턴, Provider 컴포넌트 설계, 번들 최적화 전략
- **expert-backend**: Route Handler 설계, API 계약 정의, 향후 실제 API 전환 전략

---

## 6. 의존성

| SPEC | 관계 | 설명 |
|------|------|------|
| SPEC-NEXTJS-MIGRATION-001 | 선행 완료 | Next.js 16 마이그레이션이 완료된 상태에서 진행 |
| (향후) SPEC-API-INTEGRATION-XXX | 후행 | 실제 AI API 통합 시 MSW handler를 실제 엔드포인트로 교체 |
