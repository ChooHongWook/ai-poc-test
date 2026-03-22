# UI 가이드라인

본 문서는 UI 개발 시 따라야 할 가이드라인의 목차 역할을 한다.

## General

* 레이아웃은 flexbox와 grid를 기본으로 사용하고, absolute positioning은 꼭 필요한 경우에만 사용한다
* 파일은 작게 유지하고, 헬퍼 함수와 컴포넌트는 별도 파일로 분리한다
* 리팩토링 시 기능 변경 없이 스타일만 정리한다
* UI 텍스트는 한국어로 작성한다
* 날짜 형식은 `toLocaleDateString('ko-KR')` 을 사용한다 (예: "2026. 3. 22.")

## 세부 가이드

| 가이드 | 파일 |
|---|---|
| Tailwind 스타일링 컨벤션 | [tailwind-styling-convention.md](tailwind-styling-convention.md) |
| 디자인 시스템 | [design-system.md](design-system.md) |
| 컴포넌트 | [component-guidelines.md](component-guidelines.md) |
