---
paths:
  - "app/**"
---

# Next.js App Router Naming Convention

When creating or modifying files inside the `app/` directory, apply the `_` prefix rule:

## Special Files (NO prefix)

These Next.js-recognized files must NOT have a `_` prefix:
page.tsx, layout.tsx, route.ts, loading.tsx, error.tsx, not-found.tsx, template.tsx, default.tsx, middleware.ts, global-error.tsx, opengraph-image.tsx, sitemap.ts, robots.ts

## All Other Files and Folders (MUST have `_` prefix)

Everything else inside `app/` MUST use a `_` prefix:

Folders: `_components/`, `_hooks/`, `_lib/`, `_types/`, `_constants/`
Files: `_helpers.ts`, `_constants.ts`, `_types.ts`, `_utils.ts`, `_validate.ts`, `_schema.ts`

## Examples

- `app/api/upload-analyze/route.ts` — special file, no prefix
- `app/api/upload-analyze/_validate.ts` — helper file, `_` prefix
- `app/(main)/_components/AIOutputPreview.tsx` — component folder, `_` prefix

## Rule

When creating a new file or folder inside `app/`:
1. Check if it is a Next.js special file (listed above)
2. If YES: no prefix
3. If NO: add `_` prefix to the file or folder name
