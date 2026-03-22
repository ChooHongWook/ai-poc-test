# Research: SPEC-UPLOAD-001 — LangChain.js 기반 파일 분석 API

## 1. 현재 상태 분석

### 1.1 Upload-Test 페이지 아키텍처

**파일**: `app/upload-test/page.tsx` (553줄, 'use client')

데이터 흐름:
```
FileUploadSection → uploadedFiles[] (File 객체 포함)
  → handleAnalyze() → analyzeUpload(params)
  → POST /api/upload-analyze (JSON, 메타데이터만)
  → MSW mock 또는 Route Handler fallback
  → AIOutput + HistoryItem 반환
```

**핵심 발견**: `UploadedFile.file`에 실제 `File` 객체가 이미 존재하지만 API에는 메타데이터(fileNames, fileSizes, fileTypes)만 전송됨.

### 1.2 현재 API 계층

| 파일 | 역할 | 라인 |
|------|------|------|
| `lib/api/upload-analyze.ts` | fetch 래퍼 (JSON POST) | 27 |
| `lib/mock/upload-analyze.ts` | Mock 함수 + 타입 정의 | 119 |
| `app/api/upload-analyze/route.ts` | Route Handler (mock 호출) | 16 |
| `lib/mock/handlers.ts` | MSW 핸들러 등록 | 31 |

### 1.3 참조 구현

`lib/api/generate.ts` + `app/api/generate/route.ts`가 동일 패턴 사용:
- API 클라이언트: 타입 import + fetch 래퍼
- Route Handler: `request.json()` → mock 함수 → `NextResponse.json()`
- MSW: `http.post('*/api/generate', ...)` 핸들러

### 1.4 공유 타입

```typescript
// lib/types.ts
interface AIOutput { data: Record<string, string>; generated: boolean }
interface HistoryItem { id, timestamp, systemPrompt, userPrompt, schema, inputFields[], chatgptOutput?, geminiOutput?, claudeOutput?, models? }

// lib/providers/ai-config-provider.tsx
interface AIProvider { enabled: boolean; apiKey: string; model: string }
```

---

## 2. LangChain.js 기술 조사 (Context7)

### 2.1 필수 패키지

| 패키지 | 용도 |
|--------|------|
| `@langchain/core` | 핵심 타입 및 인터페이스 |
| `@langchain/community` | 문서 로더 (PDF, CSV, Text) |
| `@langchain/openai` | ChatOpenAI |
| `@langchain/google-genai` | ChatGoogleGenerativeAI |
| `@langchain/anthropic` | ChatAnthropic |
| `pdf-parse` | PDF 파싱 (PDFLoader 의존성) |

### 2.2 문서 로더

```typescript
// PDF
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
const loader = new PDFLoader(path, { splitPages: false })

// CSV
import { CSVLoader } from "@langchain/classic/document_loaders/fs/csv"

// Text
import { TextLoader } from "@langchain/classic/document_loaders/fs/text"

// Multi-file
import { MultiFileLoader } from "@langchain/classic/document_loaders/fs/multi_file"
```

### 2.3 구조화 출력

```typescript
import { z } from "zod"
const structuredLlm = llm.withStructuredOutput(zodSchema)
const result = await structuredLlm.invoke(messages)
```

### 2.4 체인 패턴

```typescript
const chain = prompt.pipe(model)
await chain.invoke({ topic: "bears" })
```

---

## 3. 아키텍처 설계

### 3.1 권장 접근: Option B — In-Memory Blob 처리

| 접근 | 임시파일 | 서버리스 호환 | LangChain 로더 | 복잡도 |
|------|---------|-------------|---------------|--------|
| A: 서버 임시파일 | Yes | No | FS 로더 | High |
| **B: 인메모리 Blob** | **No** | **Yes** | **Web 로더** | **Medium** |
| C: 클라이언트 읽기 | No | Yes | 없음 | Low |

**Option B 선택 이유**: LangChain 완전 통합, 임시파일 불필요, 서버리스 호환

### 3.2 서비스 레이어 설계

```
lib/langchain/
├── types.ts                  # FileAnalysisInput, AnalysisChainInput
├── document-loader.ts        # loadDocuments(blob, mimeType) → Document[]
├── ai-provider-factory.ts    # createChatModel(provider, type) → BaseChatModel
└── analysis-chain.ts         # runAnalysisChain(input, model) → Record<string, string>
```

### 3.3 API 전송 변경

**Before**: JSON body (메타데이터만)
**After**: FormData (실제 파일 + config JSON)

```
POST /api/upload-analyze
Content-Type: multipart/form-data

Fields:
  files: File[] (바이너리)
  config: JSON { chatgpt, gemini, claude, systemPrompt, userPrompt, schema }
```

### 3.4 인터페이스 계약

```typescript
// document-loader.ts
loadDocuments(input: FileAnalysisInput): Promise<Document[]>

// ai-provider-factory.ts
createChatModel(provider: AIProvider, type: 'chatgpt'|'gemini'|'claude'): BaseChatModel

// analysis-chain.ts
runAnalysisChain(input: AnalysisChainInput, model: BaseChatModel): Promise<Record<string, string>>
```

---

## 4. 영향 파일 분석

| 파일 | 변경 유형 | 범위 |
|------|----------|------|
| `lib/api/upload-analyze.ts` | 수정 | JSON → FormData 전송 |
| `app/api/upload-analyze/route.ts` | 재작성 | Mock → LangChain 실 처리 |
| `app/upload-test/page.tsx` | 경미 수정 | File[] 전달 추가 |
| `lib/langchain/types.ts` | 신규 | 내부 타입 정의 |
| `lib/langchain/document-loader.ts` | 신규 | 문서 로딩 팩토리 |
| `lib/langchain/ai-provider-factory.ts` | 신규 | LLM 인스턴스 팩토리 |
| `lib/langchain/analysis-chain.ts` | 신규 | 분석 체인 |
| `package.json` | 수정 | LangChain 패키지 추가 |

**합계**: 수정 3개, 신규 4개, 유지 1개 (`lib/mock/upload-analyze.ts` - MSW 호환)

---

## 5. 위험 및 제약

| ID | 심각도 | 위험 | 완화 |
|----|--------|------|------|
| R-001 | HIGH | LangChain.js ESM/Next.js 16 호환성 | server-only 패키지, 동적 import |
| R-002 | HIGH | JSON → FormData 전환 (파괴적 변경) | 새 타입 생성, MSW 핸들러 병렬 업데이트 |
| R-003 | MEDIUM | API 키 보안 (클라이언트 전송) | POC에서 허용, UI 경고 추가 |
| R-004 | MEDIUM | 스키마 파싱 실패 | try/catch + 비구조화 출력 폴백 |
| R-005 | LOW | 토큰 예산 초과 (대용량 파일) | 12K 토큰으로 절단, 사용자 알림 |
| R-006 | LOW | MSW 간섭 | 핸들러 업데이트 또는 패스스루 |

---

## 6. 구현 순서

1. LangChain 패키지 설치
2. `lib/langchain/types.ts` — 내부 인터페이스
3. `lib/langchain/document-loader.ts` — 문서 로딩 (1, 2 의존)
4. `lib/langchain/ai-provider-factory.ts` — LLM 팩토리 (1 의존)
5. `lib/langchain/analysis-chain.ts` — 분석 체인 (1, 4 의존)
6. `lib/api/upload-analyze.ts` — FormData 전송으로 변경
7. `app/api/upload-analyze/route.ts` — 서비스 레이어 통합 (3, 4, 5 의존)
8. `app/upload-test/page.tsx` — File[] 전달 (6 의존)
9. 테스트 — 서비스 레이어 단위 테스트

---

연구 완료: 2026-03-22
팀: researcher (haiku), analyst (sonnet), architect (sonnet)
