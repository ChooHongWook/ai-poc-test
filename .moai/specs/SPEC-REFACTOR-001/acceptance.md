---
spec_id: SPEC-REFACTOR-001
type: acceptance
version: "1.0.0"
created: "2026-03-18"
updated: "2026-03-18"
---

# 인수 기준: Vite에서 Next.js App Router로 단계별 마이그레이션

---

## Phase 1: 최소 Next.js 설정

### AC-PHASE1-001: Next.js 빌드 성공

```gherkin
Given Next.js가 설치되고 Vite가 제거된 상태에서
When `next build` 명령어를 실행하면
Then 빌드가 오류 없이 성공해야 한다
And TypeScript 컴파일 오류가 0건이어야 한다
And .next 디렉토리에 빌드 결과물이 생성되어야 한다
```

### AC-PHASE1-002: 개발 서버 실행 및 페이지 로드

```gherkin
Given Next.js 설정이 완료된 상태에서
When `next dev` 명령어를 실행하면
Then 개발 서버가 포트 3000에서 시작되어야 한다
And 브라우저에서 http://localhost:3000 접속 시 메인 페이지가 로드되어야 한다
And 콘솔에 React 하이드레이션 오류가 없어야 한다
```

### AC-PHASE1-003: Tailwind CSS 스타일 적용 확인

```gherkin
Given Next.js에서 @tailwindcss/postcss가 설정된 상태에서
When 메인 페이지를 렌더링하면
Then Tailwind 유틸리티 클래스가 정상 적용되어야 한다
And theme.css의 CSS 변수가 정상 로드되어야 한다
And 기존 Vite 환경과 동일한 시각적 결과를 보여야 한다
```

### AC-PHASE1-004: Vite 잔여물 제거 확인

```gherkin
Given 마이그레이션 Phase 1이 완료된 상태에서
When 프로젝트 파일을 검사하면
Then vite.config.ts 파일이 존재하지 않아야 한다
And index.html 파일이 프로젝트 루트에 존재하지 않아야 한다
And src/main.tsx 파일이 존재하지 않아야 한다
And package.json에 vite, @vitejs/plugin-react, @tailwindcss/vite가 없어야 한다
```

### AC-PHASE1-005: 경로 별칭 동작

```gherkin
Given tsconfig.json에 @ -> ./src 경로 별칭이 설정된 상태에서
When @/app/components/ui/button 형태로 import하면
Then 올바른 모듈이 해석되어야 한다
And 빌드 시 경로 해석 오류가 발생하지 않아야 한다
```

---

## Phase 2: 컴포넌트 마이그레이션

### AC-PHASE2-001: use client 디렉티브 적용

```gherkin
Given 비즈니스 컴포넌트 8개에 "use client" 디렉티브가 추가된 상태에서
When Next.js 빌드를 실행하면
Then 모든 컴포넌트가 Client Component로 올바르게 인식되어야 한다
And "useState is not defined" 또는 유사한 서버 컴포넌트 오류가 없어야 한다
And 빌드가 성공해야 한다
```

### AC-PHASE2-002: ThemeProvider 라이트/다크 테마 전환

```gherkin
Given app/layout.tsx에 next-themes ThemeProvider가 래핑된 상태에서
When 테마 토글을 실행하면
Then HTML 요소의 class 속성에 dark/light가 전환되어야 한다
And theme.css의 CSS 변수가 테마에 맞게 적용되어야 한다
And 페이지 새로고침 후에도 선택한 테마가 유지되어야 한다
```

### AC-PHASE2-003: AI 제공자 설정 패널 동작

```gherkin
Given ConfigurationPanel 컴포넌트가 렌더링된 상태에서
When AI 제공자(ChatGPT, Gemini, Claude)를 선택하면
Then 해당 제공자의 설정 UI가 표시되어야 한다
And 복수 제공자 동시 선택이 가능해야 한다
And API Key 입력 필드와 모델 선택이 정상 동작해야 한다
```

### AC-PHASE2-004: 파일 업로드 드래그 앤 드롭

```gherkin
Given FileUploadSection 컴포넌트가 렌더링된 상태에서
When 파일을 드래그하여 업로드 영역에 드롭하면
Then 파일이 정상적으로 인식되어야 한다
And 업로드 진행 상태가 표시되어야 한다
And 지원 파일 형식(PDF, DOCX, TXT, 이미지)이 처리되어야 한다
```

### AC-PHASE2-005: 입력 데이터 동적 관리

```gherkin
Given InputDataSection 컴포넌트가 렌더링된 상태에서
When 동적 필드 추가 버튼을 클릭하면
Then 새로운 입력 필드가 추가되어야 한다
And 필드 삭제 시 해당 필드가 제거되어야 한다
And 필드 보기/JSON 보기 탭 전환이 정상 동작해야 한다
```

---

## Phase 3: 최적화

### AC-PHASE3-001: 미사용 의존성 제거 후 빌드

```gherkin
Given react-router, react-dnd, @mui/*, @emotion/* 등이 제거된 상태에서
When `next build` 명령어를 실행하면
Then 빌드가 오류 없이 성공해야 한다
And 제거된 패키지를 import하는 코드가 없어야 한다
And 기존 기능이 모두 정상 동작해야 한다
```

### AC-PHASE3-002: 번들 크기 최적화 확인

```gherkin
Given 미사용 의존성 제거와 Server Component 최적화가 완료된 상태에서
When 빌드 결과물의 번들 크기를 측정하면
Then Phase 2 대비 클라이언트 번들 크기가 감소해야 한다
And node_modules 크기가 감소해야 한다
```

---

## Edge Case 시나리오

### EC-001: CSS Import 순서 오류

```gherkin
Given CSS 파일들이 app/layout.tsx에서 import되는 상태에서
When import 순서가 fonts.css, theme.css, tailwind.css, index.css와 다르면
Then 스타일 우선순위 문제가 발생할 수 있으므로
And 올바른 import 순서를 강제하는 주석 또는 문서가 존재해야 한다
```

### EC-002: 하이드레이션 불일치

```gherkin
Given Server Component와 Client Component가 혼합된 상태에서
When 페이지가 초기 로드될 때
Then React 하이드레이션 경고가 콘솔에 출력되지 않아야 한다
And 서버 렌더링 결과와 클라이언트 렌더링 결과가 일치해야 한다
```

### EC-003: next-themes 초기 깜빡임 방지

```gherkin
Given next-themes ThemeProvider가 적용된 상태에서
When 다크 모드 설정 후 페이지를 새로고침하면
Then 라이트 -> 다크 전환 깜빡임(FOUC)이 발생하지 않아야 한다
And suppressHydrationWarning이 html 태그에 적용되어야 한다
```

### EC-004: 대용량 파일 업로드

```gherkin
Given FileUploadSection이 Next.js에서 렌더링된 상태에서
When 10MB 이상의 파일을 드래그 앤 드롭하면
Then 브라우저가 멈추지 않아야 한다
And 적절한 오류 메시지 또는 진행 상태가 표시되어야 한다
```

---

## Quality Gate 기준

### 빌드 품질

| 기준 | 목표 |
|------|------|
| TypeScript 오류 | 0건 |
| next build 성공 | 필수 |
| 콘솔 오류 | 0건 (경고는 허용) |
| 하이드레이션 오류 | 0건 |

### 기능 보존

| 기준 | 목표 |
|------|------|
| AI 제공자 설정 패널 | 기존과 동일하게 동작 |
| 프롬프트 입력 (System/User) | 기존과 동일하게 동작 |
| JSON 스키마 편집 | 기존과 동일하게 동작 |
| 입력 데이터 관리 | 기존과 동일하게 동작 |
| 파일 업로드 | 기존과 동일하게 동작 |
| 출력 결과 표시 | 기존과 동일하게 동작 |
| 테마 전환 | 기존 이상으로 동작 (ThemeProvider 추가) |

### 코드 품질

| 기준 | 목표 |
|------|------|
| Vite 잔여 코드 | 0건 |
| 불필요한 use client | 0건 |
| CSS 변수 호환성 | 100% |

---

## Definition of Done

Phase 1 완료 조건:
- [ ] `next build` 성공
- [ ] `next dev` 페이지 로드 성공
- [ ] Tailwind CSS 스타일 정상 적용
- [ ] Vite 관련 파일/의존성 완전 제거
- [ ] 경로 별칭 (@) 정상 동작

Phase 2 완료 조건:
- [ ] 비즈니스 컴포넌트 8개 "use client" 추가 완료
- [ ] ThemeProvider 구현 및 테마 전환 동작
- [ ] 모든 비즈니스 컴포넌트 정상 렌더링
- [ ] 파일 업로드 드래그 앤 드롭 동작 확인
- [ ] 하이드레이션 오류 0건

Phase 3 완료 조건:
- [ ] 미사용 의존성 제거 후 빌드 성공
- [ ] 클라이언트 번들 크기 감소 확인
- [ ] 기존 기능 동작 보존 확인
