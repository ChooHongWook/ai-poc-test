# Product Overview

## Project Name
AI Document Generation POC (ai-poc-test)

## Purpose
AI 기반 자동 문서 생성 시스템의 개념 검증(Proof of Concept) 애플리케이션.
복수의 AI 제공자(ChatGPT, Gemini, Claude)를 동시에 활용하여 구조화된 문서를 생성하고 비교할 수 있는 도구.

## Target Users
- AI 기반 문서 자동화를 검토하는 개발자/기획자
- 복수 AI 모델의 출력을 비교하려는 사용자

## Core Features

### 1. Multi-AI Provider Configuration
- ChatGPT (OpenAI), Gemini (Google), Claude (Anthropic) 동시 지원
- 각 제공자별 API Key, 모델 선택, 활성화 설정
- Quick Setup 버튼으로 빠른 구성

### 2. Prompt Management
- System Prompt: AI의 역할 및 행동 지침 정의
- User Prompt: 사용자 요구사항 입력
- JSON Schema: 출력 구조 정의

### 3. Dynamic Input Data
- 동적 입력 필드 생성/관리
- JSON 미리보기 지원
- 파일 업로드 (PDF, DOCX, TXT, 이미지 등)

### 4. Document Generation
- 활성화된 AI 제공자별 문서 동시 생성
- 탭 기반 출력 비교 인터페이스
- 생성 이력 관리

### 5. UI/UX
- 다크모드 지원
- 반응형 2컬럼 레이아웃
- Toast 알림

## Current Status
- Mock API (실제 AI API 미연동, 2초 딜레이 시뮬레이션)
- 단일 페이지 SPA (라우팅 미사용)
- 상태 영속화 없음 (새로고침 시 초기화)
