# Tailwind 스타일링 컨벤션

## cn() 유틸리티 사용

- className이 길어지면(40자 이상) `cn()` 유틸 (`lib/utils.ts`)을 사용하여 아래 의미 단위로 그룹핑한다:
  - **레이아웃**: flex, grid, position 등
  - **크기/간격**: w, h, p, m, gap 등
  - **색상/배경**: bg, text, border 색상
  - **인터랙션**: hover, focus, active, transition
  - **반응형**: sm:, md:, lg: 등
  - **상태**: disabled, aria 등
- 조건부 className은 삼항 연산자 대신 `cn()` 내부에서 `&&` 논리식을 사용한다

## CVA (class-variance-authority)

- variant가 필요한 컴포넌트는 CVA로 정의한다

## 공통 UI 컴포넌트

- 공통 UI 컴포넌트는 `components/ui/` 디렉토리에 위치하며 `cn()`으로 className merge를 지원한다
- Button, Badge, Input 등 `components/ui/`에 존재하는 공통 컴포넌트로 대체 가능한 곳은 대체한다

## @apply 사용 제한

- `@apply` 사용을 지양한다 (서드파티 스타일 오버라이드 등 제한적 경우만 허용)

## 컴포넌트 추출 기준

- 동일 스타일 조합이 3회 이상 반복되면 코멘트로 방향성을 제안한 뒤, 제안된 내용을 바탕으로 컴포넌트를 추출한다

## 리팩토링 주의사항

- 기능이 변경되면 안 된다 (스타일만 리팩토링)
- `cn()` import 경로는 프로젝트의 alias 설정에 맞춘다
- 변경 전/후 스타일이 동일한지 반드시 확인한다
