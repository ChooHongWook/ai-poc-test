---
id: SPEC-UPLOAD-001
type: acceptance
version: "1.0.0"
---

# SPEC-UPLOAD-001: 인수 기준

## 시나리오 목록

### AC-01: PDF 파일 분석 성공

**Given** ChatGPT가 활성화되어 있고 유효한 OPENAI_API_KEY가 환경변수에 설정됨
**And** 텍스트가 포함된 유효한 PDF 파일이 준비됨
**When** 사용자가 PDF 파일을 업로드하고 "파일 분석 테스트" 버튼을 클릭함
**Then** 파일이 FormData로 서버에 전송됨
**And** PDFLoader가 파일 내용을 텍스트로 변환함
**And** ChatGPT가 실제 파일 내용을 분석한 결과가 AIOutput 형태로 표시됨

### AC-02: 복수 AI 제공자 동시 분석

**Given** ChatGPT, Gemini, Claude 모두 활성화됨 (3개 API 키 모두 설정)
**When** 사용자가 TXT 파일을 업로드하고 분석을 실행함
**Then** 3개 제공자의 분석 결과가 각각 독립적으로 표시됨
**And** 각 결과에 제공자 이름이 명시됨
**And** Promise.allSettled를 통해 동시 실행됨

### AC-03: 부분 실패 처리

**Given** ChatGPT는 유효한 API 키가 설정되어 있음
**And** Gemini는 잘못된 API 키가 설정되어 있음
**When** 사용자가 파일을 업로드하고 분석을 실행함
**Then** ChatGPT 결과는 정상적으로 표시됨
**And** Gemini 결과에는 에러 메시지가 표시됨
**And** 전체 요청이 실패하지 않음

### AC-04: 미지원 파일 형식 거부

**Given** 사용자가 .exe 파일을 업로드함
**When** 분석을 실행함
**Then** "지원하지 않는 파일 형식입니다" 에러 메시지가 표시됨
**And** 서버에서 400 상태 코드가 반환됨

### AC-05: 구조화 출력 (Zod 스키마 제공)

**Given** JSON 스키마(Zod)가 분석 요청에 포함됨
**And** 유효한 AI 제공자가 활성화됨
**When** 분석을 실행함
**Then** AI 응답이 제공된 스키마 구조를 따르는 JSON으로 반환됨
**And** withStructuredOutput()이 적용됨

## 엣지 케이스

### EC-01: 10MB 초과 파일 거부

**Given** 사용자가 10MB를 초과하는 파일을 업로드함
**When** 분석을 실행함
**Then** "파일 크기가 10MB를 초과합니다" 에러 메시지가 반환됨
**And** 서버에서 413 상태 코드가 반환됨

### EC-02: API 키 미설정 시 에러

**Given** 모든 AI 제공자의 API 키가 환경변수에 설정되지 않음
**When** 분석을 실행함
**Then** "활성화된 AI 제공자가 없습니다. API 키를 설정하세요." 에러 메시지가 반환됨
**And** 서버에서 400 상태 코드가 반환됨

### EC-03: 빈 파일 처리

**Given** 사용자가 0바이트 빈 파일을 업로드함
**When** 분석을 실행함
**Then** "빈 파일은 분석할 수 없습니다" 에러 메시지가 반환됨

### EC-04: 대용량 파일 토큰 절단

**Given** 파일 내용이 모델의 컨텍스트 윈도우를 초과하는 텍스트를 포함함
**When** 분석을 실행함
**Then** 텍스트가 적절한 길이로 절단됨
**And** 절단 사실이 응답에 명시됨
**And** 절단된 범위 내에서 분석이 정상 수행됨

## 품질 게이트

| 항목 | 기준 |
|------|------|
| 서비스 레이어 단위 테스트 | document-loader, ai-provider-factory, analysis-chain 각각 테스트 |
| 에러 처리 | 모든 엣지 케이스(EC-01~04)에 대한 에러 응답 검증 |
| 타입 안전성 | TypeScript strict 모드에서 컴파일 에러 없음 |
| API 호환성 | 기존 AIOutput 인터페이스와 응답 구조 호환 |
| 보안 | API 키가 클라이언트에 노출되지 않음 확인 |

## Definition of Done

- [ ] 모든 인수 기준(AC-01~05) 통과
- [ ] 모든 엣지 케이스(EC-01~04) 처리 확인
- [ ] 서비스 레이어 단위 테스트 작성 및 통과
- [ ] TypeScript 컴파일 에러 없음
- [ ] ESM 호환성 검증 완료
- [ ] 기존 AIOutput 인터페이스 호환 확인
