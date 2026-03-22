---
id: SPEC-UPLOAD-001
type: plan
version: "1.0.0"
---

# SPEC-UPLOAD-001: 구현 계획

## 1. 구현 순서

### Milestone 1: 기반 구축 (Priority High)

**Step 1: LangChain 패키지 설치**
- 의존성: 없음
- 작업: pnpm add @langchain/core @langchain/community @langchain/openai @langchain/google-genai @langchain/anthropic pdf-parse zod
- 검증: 패키지 설치 확인, ESM 호환성 검증

**Step 2: lib/langchain/types.ts -- 내부 인터페이스 정의**
- 의존성: Step 1
- 작업:
  - `AnalysisRequest` 인터페이스 (files, enabledProviders, schema?)
  - `AnalysisResult` 인터페이스 (provider, content, structuredOutput?)
  - `ProviderResult` 타입 (성공/실패 union)
  - `SupportedFileType` 타입 리터럴
- 영향 파일: 신규 생성

**Step 3: lib/langchain/document-loader.ts -- 문서 로딩 팩토리**
- 의존성: Step 2
- 작업:
  - `loadDocument(file: Buffer, mimeType: string): Promise<Document[]>` 구현
  - MIME 타입 기반 Loader 선택 로직
  - PDF: PDFLoader (In-Memory Blob 방식)
  - CSV: CSVLoader (In-Memory Blob 방식)
  - TXT/MD: TextLoader (In-Memory Blob 방식)
  - 미지원 형식 에러 처리
- 영향 파일: 신규 생성

### Milestone 2: AI 연동 (Priority High)

**Step 4: lib/langchain/ai-provider-factory.ts -- LLM 인스턴스 팩토리**
- 의존성: Step 2
- 작업:
  - `createProviders(): Map<string, BaseChatModel>` 구현
  - 환경변수 기반 활성 제공자 감지
  - ChatOpenAI (gpt-4o-mini), ChatGoogleGenerativeAI (gemini-2.0-flash), ChatAnthropic (claude-sonnet-4-20250514) 인스턴스 생성
  - API 키 없는 제공자 건너뛰기
- 영향 파일: 신규 생성

**Step 5: lib/langchain/analysis-chain.ts -- 분석 체인 구성**
- 의존성: Step 3, Step 4
- 작업:
  - `analyzeDocument(docs: Document[], providers: Map, schema?: ZodSchema): Promise<ProviderResult[]>` 구현
  - ChatPromptTemplate으로 분석 프롬프트 구성
  - RunnableSequence 체인 조립
  - Zod 스키마 존재 시 withStructuredOutput() 적용
  - Promise.allSettled로 복수 제공자 동시 호출
  - 부분 실패 처리 로직
- 영향 파일: 신규 생성

### Milestone 3: API 계층 전환 (Priority High)

**Step 6: lib/api/upload-analyze.ts -- 전송 방식 변경**
- 의존성: Step 5
- 작업:
  - JSON POST -> FormData POST 변환
  - File[] 객체를 FormData에 append
  - 기존 메타데이터 파라미터 호환 유지
  - 응답 파싱 로직 유지 (AIOutput 호환)
- 영향 파일: 기존 수정

**Step 7: app/api/upload-analyze/route.ts -- Route Handler 통합**
- 의존성: Step 5, Step 6
- 작업:
  - request.formData() 수신
  - File -> Buffer 변환
  - LangChain 서비스 레이어 호출 (document-loader -> ai-provider-factory -> analysis-chain)
  - 에러 핸들링 (파일 크기, 형식, API 키 검증)
  - 응답을 기존 AIOutput 형식으로 변환
- 영향 파일: 기존 수정

### Milestone 4: UI 연동 (Priority Medium)

**Step 8: app/upload-test/page.tsx -- 클라이언트 수정**
- 의존성: Step 6
- 작업:
  - handleAnalyze()에서 File[] 객체를 analyzeUpload()에 전달
  - 기존 메타데이터 전송 로직 제거
  - 분석 결과 표시 로직은 AIOutput 호환으로 변경 최소화
- 영향 파일: 기존 수정

### Milestone 5: 품질 보증 (Priority Medium)

**Step 9: 서비스 레이어 단위 테스트**
- 의존성: Step 5
- 작업:
  - document-loader.ts 테스트 (형식별 로딩, 에러 케이스)
  - ai-provider-factory.ts 테스트 (환경변수 기반 생성)
  - analysis-chain.ts 테스트 (부분 실패, 구조화 출력)
- 영향 파일: 신규 생성

## 2. 기술 스택

| 패키지 | 용도 |
|--------|------|
| @langchain/core | 핵심 추상화 (Document, ChatPromptTemplate, RunnableSequence) |
| @langchain/community | 문서 로더 (PDFLoader, CSVLoader, TextLoader) |
| @langchain/openai | ChatOpenAI LLM 제공자 |
| @langchain/google-genai | ChatGoogleGenerativeAI LLM 제공자 |
| @langchain/anthropic | ChatAnthropic LLM 제공자 |
| pdf-parse | PDF 텍스트 추출 (PDFLoader 의존성) |
| zod | 구조화 출력 스키마 정의 |

## 3. 아키텍처: In-Memory Blob 처리 (Option B)

```
[Client]                    [Server Route Handler]           [LangChain Service Layer]
   |                              |                                |
   |-- FormData (File[]) -------->|                                |
   |                              |-- Buffer 변환 --------------->|
   |                              |                                |-- document-loader
   |                              |                                |   (In-Memory Blob)
   |                              |                                |
   |                              |                                |-- ai-provider-factory
   |                              |                                |   (환경변수 기반)
   |                              |                                |
   |                              |                                |-- analysis-chain
   |                              |                                |   (Promise.allSettled)
   |                              |                                |
   |                              |<-- ProviderResult[] ----------|
   |<-- AIOutput (JSON) ----------|                                |
```

선택 이유:
- 임시 파일 생성 없음 -> 서버리스 환경(Vercel) 호환
- 메모리에서 직접 처리 -> 디스크 I/O 없음
- 파일 정리 로직 불필요 -> 코드 단순화

## 4. 영향 분석

### 수정 파일 (4개)

| 파일 | 변경 내용 |
|------|----------|
| `lib/api/upload-analyze.ts` | JSON -> FormData 전송 방식 변경 |
| `app/api/upload-analyze/route.ts` | LangChain 서비스 레이어 통합 |
| `app/upload-test/page.tsx` | File[] 전달 방식 변경 |
| `package.json` | LangChain 패키지 추가 |

### 신규 파일 (4개)

| 파일 | 역할 |
|------|------|
| `lib/langchain/types.ts` | 내부 인터페이스 정의 |
| `lib/langchain/document-loader.ts` | 문서 로딩 팩토리 |
| `lib/langchain/ai-provider-factory.ts` | AI 제공자 팩토리 |
| `lib/langchain/analysis-chain.ts` | 분석 체인 구성 |

## 5. 위험 분석

| 위험 | 심각도 | 설명 | 대응 방안 |
|------|--------|------|----------|
| ESM 호환성 | HIGH | @langchain 패키지가 ESM-only로 배포되어 Next.js와 충돌 가능 | next.config에 transpilePackages 설정, serverExternalPackages 확인 |
| FormData 전환 | HIGH | JSON -> FormData 변경으로 기존 MSW mock 핸들러 호환성 깨짐 | MSW 핸들러를 FormData 수신 방식으로 업데이트 |
| API 키 보안 | MEDIUM | 환경변수의 API 키가 클라이언트에 노출될 위험 | 서버 사이드에서만 키 접근, NEXT_PUBLIC_ 접두사 미사용 확인 |
| pdf-parse 호환성 | MEDIUM | pdf-parse의 Node.js 전용 API(fs, path)가 Edge Runtime에서 작동 불가 | runtime: 'nodejs' 설정으로 Edge Runtime 사용 회피 |
| 토큰 한계 | LOW | 대용량 PDF의 텍스트가 모델 컨텍스트 윈도우 초과 | 텍스트 길이 체크 후 절단 처리 구현 |
