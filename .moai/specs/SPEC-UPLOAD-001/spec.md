---
id: SPEC-UPLOAD-001
version: "1.0.0"
status: draft
created: "2026-03-22"
updated: "2026-03-22"
author: hw
priority: P2
issue_number: 0
---

## HISTORY

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2026-03-22 | hw | 초기 작성 |

# SPEC-UPLOAD-001: LangChain.js 기반 실제 AI 파일 분석 API

## 1. 환경 (Environment)

### 1.1 현재 상태

- `app/upload-test/page.tsx`에서 파일 업로드 UI가 구현되어 있으며, `UploadedFile.file`에 실제 `File` 객체가 존재함
- 현재 API는 파일 메타데이터(fileNames, fileSizes, fileTypes)만 JSON으로 전송하며, 실제 파일 바이너리는 서버로 전달되지 않음
- MSW mock 또는 Route Handler fallback으로 가짜 응답을 반환하는 구조
- `lib/api/upload-analyze.ts`가 fetch 래퍼(JSON POST) 역할, `app/api/upload-analyze/route.ts`가 Route Handler 역할

### 1.2 목표 상태

- LangChain.js를 활용하여 실제 파일 내용을 파싱하고, 복수의 AI 제공자(OpenAI, Google Gemini, Anthropic Claude)가 동시에 분석하는 파이프라인 구축
- FormData 기반 파일 전송으로 실제 바이너리가 서버에 도달
- Zod 스키마 기반 구조화 출력(Structured Output) 지원

### 1.3 기술 스택

- @langchain/core, @langchain/community (PDFLoader, CSVLoader, TextLoader)
- @langchain/openai (ChatOpenAI)
- @langchain/google-genai (ChatGoogleGenerativeAI)
- @langchain/anthropic (ChatAnthropic)
- pdf-parse (PDF 파싱 의존성)
- Zod (구조화 출력 스키마)

## 2. 가정 (Assumptions)

- 사용자는 환경변수로 AI 제공자별 API 키를 설정함 (OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, ANTHROPIC_API_KEY)
- 파일 크기 상한은 10MB로 제한함
- 지원 파일 형식: PDF (.pdf), CSV (.csv), TXT (.txt), Markdown (.md)
- In-Memory Blob 처리 방식 사용 (임시 파일 없음, 서버리스 호환)
- Next.js App Router의 Route Handler에서 FormData 수신이 가능함

## 3. 요구사항 (Requirements)

### REQ-01: LangChain.js 기반 문서 파싱 (Ubiquitous)

시스템은 **항상** 업로드된 파일을 LangChain.js의 Document Loader(PDFLoader, CSVLoader, TextLoader)를 사용하여 텍스트로 변환해야 한다.

### REQ-02: Multi-AI 제공자 동시 분석 (Event-Driven)

사용자가 파일 업로드 후 분석을 요청**하면**, 시스템은 활성화된 모든 AI 제공자(ChatOpenAI, ChatGoogleGenerativeAI, ChatAnthropic)에게 **동시에** 분석을 요청하고, 각 제공자별 결과를 독립적으로 반환해야 한다.

### REQ-03: FormData 기반 파일 전송 (Event-Driven)

사용자가 파일을 선택하고 분석 버튼을 클릭**하면**, 시스템은 실제 File 객체를 FormData에 담아 서버로 전송해야 한다. JSON 메타데이터만 전송하는 기존 방식을 대체한다.

### REQ-04: 부분 실패 처리 (Unwanted Behavior)

AI 제공자 중 일부가 실패**한 경우**, 시스템은 성공한 제공자의 결과는 정상 표시하고, 실패한 제공자에 대해서는 에러 메시지를 개별적으로 반환해야 한다. Promise.allSettled를 사용하여 전체 요청이 하나의 실패로 중단되지 않아야 한다.

### REQ-05: 구조화 출력 (Optional)

Zod 스키마가 제공된 **경우에 한해**, 시스템은 withStructuredOutput()을 사용하여 AI 응답을 제공된 스키마 구조에 맞게 변환하여 반환해야 한다.

## 4. 명세 (Specifications)

### SPEC-01: 서비스 레이어 구조

```
lib/langchain/
  types.ts              -- 내부 인터페이스 및 타입 정의
  document-loader.ts    -- 파일 형식별 Document Loader 팩토리
  ai-provider-factory.ts -- AI 제공자(LLM) 인스턴스 팩토리
  analysis-chain.ts     -- 프롬프트 -> 모델 -> 출력 체인 구성
```

### SPEC-02: Document Loader 팩토리

- 파일 MIME 타입 또는 확장자 기반으로 적절한 Loader 선택
- PDF: `PDFLoader` (pdf-parse 기반, In-Memory Blob)
- CSV: `CSVLoader` (In-Memory Blob)
- TXT/MD: `TextLoader` (In-Memory Blob)
- 미지원 형식: `UnsupportedFileTypeError` 발생

### SPEC-03: AI Provider Factory

- 환경변수에서 API 키를 읽어 활성화된 제공자만 인스턴스 생성
- ChatOpenAI: model `gpt-4o-mini`, temperature 0.3
- ChatGoogleGenerativeAI: model `gemini-2.0-flash`, temperature 0.3
- ChatAnthropic: model `claude-sonnet-4-20250514`, temperature 0.3
- API 키가 없는 제공자는 건너뜀

### SPEC-04: Analysis Chain

- ChatPromptTemplate으로 분석 프롬프트 구성
- RunnableSequence: prompt -> model -> (optional) structuredOutput -> outputParser
- Zod 스키마 존재 시 `model.withStructuredOutput(schema)` 적용
- 스키마 없을 시 StringOutputParser 사용

### SPEC-05: API 전송 계층 변경

- 클라이언트: `analyzeUpload()` 함수가 JSON 대신 FormData로 File 객체 전송
- 서버: Route Handler에서 `request.formData()` 수신 후 Buffer 변환
- 응답 형식: 기존 `AIOutput` 인터페이스 호환 유지

## 5. 제약사항 (Constraints)

- 파일 크기: 최대 10MB
- API 키 미설정 시: 해당 제공자 비활성화 (최소 1개 필요, 없으면 400 에러)
- 빈 파일: 0바이트 파일 업로드 시 에러 반환
- 토큰 제한: 대용량 파일 텍스트가 모델 컨텍스트 윈도우 초과 시 절단 처리
- ESM 호환성: @langchain 패키지의 ESM-only 특성 고려, Next.js 설정 확인 필요

## 6. 추적성 (Traceability)

| 요구사항 | 구현 파일 | 테스트 시나리오 |
|---------|----------|--------------|
| REQ-01 | lib/langchain/document-loader.ts | AC-01 |
| REQ-02 | lib/langchain/ai-provider-factory.ts, analysis-chain.ts | AC-02 |
| REQ-03 | lib/api/upload-analyze.ts, app/api/upload-analyze/route.ts | AC-01 |
| REQ-04 | lib/langchain/analysis-chain.ts | AC-03 |
| REQ-05 | lib/langchain/analysis-chain.ts | AC-05 |
