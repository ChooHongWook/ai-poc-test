---
paths: "app/**"
---

# Next.js App Router 네이밍 규칙

`app/` 디렉토리 내에서 파일을 생성하거나 수정할 때, `_` 접두사 규칙을 적용하세요:

## 특수 파일 (접두사 없음)

다음 Next.js 인식 파일에는 `_` 접두사를 붙이지 않아야 합니다:
page.tsx, layout.tsx, route.ts, loading.tsx, error.tsx, not-found.tsx, template.tsx, default.tsx, middleware.ts, global-error.tsx, opengraph-image.tsx, sitemap.ts, robots.ts

## 그 외 모든 파일 및 폴더 (`_` 접두사 필수)

`app/` 내부의 그 외 모든 항목에는 반드시 `_` 접두사를 사용해야 합니다:

폴더: `_components/`, `_hooks/`, `_lib/`, `_types/`, `_constants/`
파일: `_helpers.ts`, `_constants.ts`, `_types.ts`, `_utils.ts`, `_validate.ts`, `_schema.ts`

## 예시

- `app/api/upload-analyze/route.ts` — 특수 파일, 접두사 없음
- `app/api/upload-analyze/_validate.ts` — 헬퍼 파일, `_` 접두사
- `app/(main)/_components/AIOutputPreview.tsx` — 컴포넌트 폴더, `_` 접두사

## 규칙

`app/` 내부에 새 파일이나 폴더를 생성할 때:
1. Next.js 특수 파일(위 목록)에 해당하는지 확인
2. 해당하면: 접두사 없음
3. 해당하지 않으면: 파일 또는 폴더 이름에 `_` 접두사 추가
