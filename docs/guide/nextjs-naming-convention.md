# Next.js App Router 네이밍 규칙

## 개요

`app/` 디렉토리 내부에서 Next.js가 인식하는 특수 파일을 제외한 모든 파일과 폴더는 `_` 접두사를 붙인다. 이를 통해 라우팅 대상 파일과 내부 모듈을 명확히 구분한다.

## 특수 파일 (접두사 없음)

Next.js App Router가 인식하는 파일은 접두사 없이 그대로 사용한다:

* `page.tsx` — 라우트 페이지
* `layout.tsx` — 레이아웃
* `route.ts` — API 라우트 핸들러
* `loading.tsx` — 로딩 UI
* `error.tsx` — 에러 UI
* `not-found.tsx` — 404 UI
* `template.tsx` — 템플릿
* `default.tsx` — 병렬 라우트 기본 UI
* `middleware.ts` — 미들웨어 (app 루트)
* `global-error.tsx` — 글로벌 에러 UI
* `opengraph-image.tsx` — OG 이미지
* `sitemap.ts` — 사이트맵
* `robots.ts` — robots.txt

## `_` 접두사 대상

위 특수 파일을 제외한 모든 파일과 폴더에 `_` 접두사를 붙인다:

### 폴더

* `_components/` — 해당 라우트 전용 컴포넌트
* `_hooks/` — 해당 라우트 전용 훅
* `_lib/` — 해당 라우트 전용 유틸리티
* `_types/` — 해당 라우트 전용 타입 정의
* `_constants/` — 해당 라우트 전용 상수

### 파일

* `_helpers.ts` — 헬퍼 함수
* `_constants.ts` — 상수 정의
* `_types.ts` — 타입 정의
* `_utils.ts` — 유틸리티 함수
* `_validate.ts` — 유효성 검증 로직
* `_schema.ts` — 스키마 정의

## 예시

```
app/
├── layout.tsx              # 특수 파일
├── page.tsx                # 특수 파일
├── (main)/
│   ├── page.tsx            # 특수 파일
│   └── _components/        # _ 접두사
│       ├── ConfigurationPanel.tsx
│       └── AIOutputPreview.tsx
├── api/
│   └── upload-analyze/
│       ├── route.ts        # 특수 파일
│       └── _validate.ts    # _ 접두사
└── settings/
    ├── page.tsx            # 특수 파일
    └── _hooks/             # _ 접두사
        └── useSettings.ts
```

## 이유

* Next.js App Router는 `_` 접두사 폴더를 라우팅에서 자동 제외한다 ([Private Folders](https://nextjs.org/docs/app/getting-started/project-structure#private-folders))
* 라우팅 대상과 내부 모듈의 시각적 구분이 명확해진다
* 폴더뿐 아니라 파일에도 동일 규칙을 적용하여 일관성을 유지한다

## 관련 규칙

이 가이드에 대응하는 Claude 자동 로드 규칙: `.claude/rules/nextjs-naming.md`
