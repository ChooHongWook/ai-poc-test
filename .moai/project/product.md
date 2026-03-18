# Product Overview

## 프로젝트명
AI 문서 생성 시스템 (AI Document Generation System)

## 패키지명
@figma/my-make-file (v0.0.1)

## 프로젝트 목적
여러 AI 제공자(ChatGPT, Gemini, Claude)를 활용한 문서 자동 생성 시스템.
팀 내부 사용자를 대상으로 하며, POC 단계에서 프로덕션 제품으로 발전 예정.

## 대상 사용자
- 팀 내부 사용자 (B2B 내부 도구)

## 핵심 기능

### 1. AI 제공자 설정
- ChatGPT (GPT-4, GPT-4 Turbo, GPT-4o, GPT-3.5 Turbo)
- Gemini (Gemini Pro, Gemini Pro Vision, Gemini Ultra)
- Claude (Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku, Claude 2)
- 복수 제공자 동시 선택 가능
- 각 제공자별 API Key 입력 및 모델 선택

### 2. 프롬프트 정의
- System Prompt: AI 역할 및 행동 방식 정의
- User Prompt: 구체적인 문서 생성 요구사항 입력

### 3. 스키마 정의
- JSON Schema로 출력 데이터 구조 정의
- JSON 유효성 검사 및 에러 표시

### 4. 입력 데이터 관리
- 동적 필드 추가/제거
- 필드 보기 및 JSON 보기 탭

### 5. 파일 업로드
- 드래그 & 드롭 파일 업로드
- PDF, DOCX, TXT, 이미지 등 지원

### 6. 문서 생성 및 결과 확인
- 복수 AI 제공자 동시 생성
- 제공자별 결과 비교 표시
- 필드 보기 / JSON 보기 탭

## 현재 상태
- POC 단계 (더미 출력, 실제 AI API 미연동)
- UI/UX 프로토타입 완성
- Next.js App Router로 마이그레이션 완료 (2026-03-18)
- 테마 시스템 활성화 (next-themes ThemeProvider)
- 프로덕션 제품으로 발전 계획 중

## UI 언어
- 한국어 (ko)
