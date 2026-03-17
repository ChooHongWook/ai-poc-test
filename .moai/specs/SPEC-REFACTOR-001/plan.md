---
spec_id: SPEC-REFACTOR-001
type: plan
version: "1.0.0"
created: "2026-03-18"
updated: "2026-03-18"
---

# 구현 계획: Vite에서 Next.js App Router로 단계별 마이그레이션

## 마이그레이션 전략

**접근 방식:** 단계별 교체 (Big Bang 아님)
- Phase별로 독립적으로 검증 가능한 마일스톤 설정
- 각 Phase 완료 시점에서 빌드 성공 + UI 렌더링 확인
- 기존 기능의 동작 보존을 최우선으로 함

---

## Phase 1: 최소 Next.js 설정 (Primary Goal)

**목표:** Vite를 Next.js로 교체하고 기본 빌드가 성공하는 상태 달성

### Task 1.1: Next.js 설치 및 Vite 제거
- `next` 패키지 설치
- `@tailwindcss/postcss` 설치
- `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite` 제거
- package.json scripts 변경 (dev, build, start)

**관련 요구사항:** REQ-BUILD-001, REQ-BUILD-002

### Task 1.2: 설정 파일 교체
- `vite.config.ts` 삭제
- `index.html` 삭제
- `src/main.tsx` 삭제
- `postcss.config.mjs` 삭제
- `next.config.mjs` 생성 (경로 별칭 등 기본 설정)
- `postcss.config.cjs` 생성 (@tailwindcss/postcss 설정)

**관련 요구사항:** REQ-BUILD-003, REQ-BUILD-004

### Task 1.3: App Router 구조 생성
- `app/layout.tsx` 생성 (HTML 구조, 폰트, 글로벌 CSS import)
- `app/page.tsx` 생성 (기존 App.tsx 내용 래핑)
- `tsconfig.json` paths 설정 업데이트 (@ -> ./src)

**관련 요구사항:** REQ-APPROUTER-001, REQ-APPROUTER-002, REQ-APPROUTER-003

### Phase 1 완료 기준
- `next build` 성공 (TypeScript 오류 0건)
- `next dev` 실행 시 페이지 로드 확인
- Tailwind CSS 스타일 정상 적용

---

## Phase 2: 컴포넌트 마이그레이션 (Secondary Goal)

**목표:** 모든 컴포넌트가 Next.js App Router에서 정상 동작

### Task 2.1: use client 디렉티브 추가
- 비즈니스 컴포넌트 8개에 "use client" 추가
- 대상: App.tsx, ConfigurationPanel, FileUploadSection, InputDataSection, OutputDataSection, SchemaSection, SystemPromptSection, UserPromptSection

**관련 요구사항:** REQ-CLIENT-001, REQ-CLIENT-002, REQ-CLIENT-003

### Task 2.2: ThemeProvider 구현
- app/layout.tsx에 next-themes ThemeProvider 래핑
- `attribute="class"` 설정 적용
- 기존 theme.css CSS 변수 시스템과 연동 확인

**관련 요구사항:** REQ-THEME-001, REQ-THEME-002

### Task 2.3: 컴포넌트별 동작 검증
- AI 제공자 설정 패널 동작 확인
- 파일 업로드 드래그 앤 드롭 동작 확인
- 입력 데이터 동적 필드 추가/제거 확인
- JSON 스키마 편집기 동작 확인
- 출력 데이터 탭 전환 확인

### Phase 2 완료 기준
- 모든 비즈니스 컴포넌트 정상 렌더링
- ThemeProvider 라이트/다크 테마 전환 동작
- 파일 업로드 드래그 앤 드롭 동작
- TypeScript 오류 0건

---

## Phase 3: 최적화 (Optional Goal)

**목표:** 코드베이스 정리 및 Next.js 기능 활용

### Task 3.1: 미사용 의존성 제거
- react-router 7.13.0 제거
- react-dnd 16.0.1 제거
- @mui/material, @mui/icons-material, @emotion/react, @emotion/styled 제거
- recharts, react-responsive-masonry, react-slick, canvas-confetti 제거 (사용 여부 확인 후)

**관련 요구사항:** REQ-OPT-001

### Task 3.2: Server Components 최적화
- 상태 미사용 UI 컴포넌트를 Server Component로 유지
- 불필요한 "use client" 전파 방지
- 번들 크기 최적화

**관련 요구사항:** REQ-OPT-002

### Task 3.3: Next.js 고유 기능 적용 (향후)
- Next.js Image 컴포넌트 적용 (ImageWithFallback.tsx 교체)
- Metadata API 활용
- 필요 시 추가 라우트 구성

### Phase 3 완료 기준
- 미사용 의존성 제거 후 빌드 성공
- 번들 크기 감소 확인
- 기존 기능 동작 보존

---

## 기술 스택 변경 요약

| 영역 | 변경 전 | 변경 후 |
|------|---------|---------|
| 빌드 도구 | Vite 6.3.5 | Next.js (latest stable) |
| React 플러그인 | @vitejs/plugin-react 4.7.0 | Next.js 내장 |
| Tailwind 플러그인 | @tailwindcss/vite 4.1.12 | @tailwindcss/postcss 4.x |
| 진입점 | index.html + main.tsx | app/layout.tsx + app/page.tsx |
| 개발 서버 포트 | 5173 | 3000 |
| 빌드 명령어 | vite build | next build |
| 개발 명령어 | vite | next dev |

---

## 의존성 관계 (Task 순서)

```
Task 1.1 (의존성 교체)
    |
    v
Task 1.2 (설정 파일 교체)
    |
    v
Task 1.3 (App Router 구조) ---> Phase 1 완료 검증
    |
    v
Task 2.1 (use client 추가) + Task 2.2 (ThemeProvider) [병렬 가능]
    |
    v
Task 2.3 (컴포넌트 동작 검증) ---> Phase 2 완료 검증
    |
    v
Task 3.1 (의존성 정리) + Task 3.2 (Server Components) [병렬 가능]
    |
    v
Task 3.3 (Next.js 기능 활용) ---> Phase 3 완료 검증
```

---

## 위험 분석 및 대응

### 위험 1: HMR 동작 차이 (Low)
- **설명:** Vite HMR과 Next.js Fast Refresh 간 동작 차이 발생 가능
- **영향:** 개발 경험 차이 (프로덕션 영향 없음)
- **대응:** Next.js Fast Refresh는 React 컴포넌트에 최적화되어 있으므로 큰 문제 없을 것으로 예상

### 위험 2: 파일 업로드 드래그 앤 드롭 (Medium)
- **설명:** FileUploadSection의 드래그 앤 드롭이 Next.js에서 다르게 동작할 수 있음
- **영향:** 핵심 기능 중 하나인 파일 업로드 기능 영향
- **대응:** Phase 2에서 집중 검증, 필요 시 이벤트 핸들러 조정

### 위험 3: CSS Import 순서 (Low)
- **설명:** Next.js의 CSS import 처리가 Vite와 다를 수 있음
- **영향:** 스타일 우선순위 변경으로 UI 깨짐 가능
- **대응:** app/layout.tsx에서 CSS import 순서 명시적 관리 (fonts.css -> theme.css -> tailwind.css -> index.css)

### 위험 4: 경로 별칭 충돌 (Low)
- **설명:** tsconfig.json의 @ 별칭이 Next.js 기본 설정과 충돌할 수 있음
- **영향:** import 경로 해석 실패
- **대응:** next.config.mjs에서 경로 별칭 명시적 설정

---

## 전문가 자문 권장

- **expert-frontend**: UI 컴포넌트 마이그레이션 및 Server/Client Component 경계 설계
- **expert-refactoring**: 미사용 의존성 식별 및 안전한 제거 전략
