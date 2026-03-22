# 컴포넌트 가이드라인

## Button

Button 컴포넌트는 `class-variance-authority`(CVA)로 정의된 공통 UI 컴포넌트다.

### Variants
* **default** : 주요 액션에 사용. `bg-primary` 배경
* **destructive** : 삭제 등 위험한 액션에 사용
* **outline** : 보조 액션에 사용. 테두리 스타일
* **secondary** : 대안 액션에 사용. `bg-secondary` 배경
* **ghost** : 최소한의 시각적 강조. hover 시에만 배경 표시
* **link** : 텍스트 링크 스타일

### Sizes
* **default** : `h-9 px-4`
* **sm** : `h-8 px-3`
* **lg** : `h-10 px-6`
* **icon** : `size-9` 정사각형 (아이콘 전용)

### Usage
* 섹션당 Primary 버튼은 하나만 사용한다
* 로딩 상태는 `disabled` + `Loader2` 아이콘 스피너로 표현한다
* 아이콘과 텍스트를 함께 사용할 때 아이콘에 `mr-2` 간격을 준다

## Card

* 카드 영역은 `bg-card` 배경과 `border` 테두리를 사용한다
* 카드 내부 패딩은 `p-4` 또는 `p-6` 을 사용한다

## Input & Textarea

* `components/ui/input.tsx`, `components/ui/textarea.tsx`의 공통 컴포넌트를 사용한다
* 입력 필드 배경은 `--input-background` 변수를 따른다

## 공통 UI 컴포넌트

* `components/ui/` 디렉토리에 있는 컴포넌트(Button, Badge, Input, Select, Dialog 등)를 우선 사용한다
* 새 공통 컴포넌트 생성 시 기존 패턴(CVA + `cn()` + Radix UI primitive)을 따른다
* className 병합은 반드시 `cn()` 유틸리티를 사용한다
