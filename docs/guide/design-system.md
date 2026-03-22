# 디자인 시스템 가이드라인

## 테마 & 색상

* CSS 변수 기반 테마 시스템을 사용한다 (`--background`, `--foreground`, `--primary` 등)
* 색상은 Tailwind 테마 토큰으로만 참조한다 (예: `bg-primary`, `text-muted-foreground`)
* 하드코딩된 색상값(`#fff`, `rgb(...)` 등)을 직접 사용하지 않는다
* 다크 모드는 `.dark` 클래스 토글 방식이며, `dark:` variant가 아닌 CSS 변수 자동 전환에 의존한다

## 타이포그래피

* 기본 폰트 크기는 16px (`--font-size: 16px`)
* heading(h1~h4), label, button, input의 기본 스타일은 `@layer base`에 정의되어 있으므로 별도 지정하지 않는다
* font-weight는 CSS 변수를 사용한다: `--font-weight-medium: 500`, `--font-weight-normal: 400`

## 간격 & 레이아웃

* 컨테이너는 `container mx-auto px-4` 패턴을 사용한다
* 섹션 간 간격은 `space-y-6` 을 기본으로 한다
* 2열 레이아웃은 `grid grid-cols-1 lg:grid-cols-2 gap-6` 패턴을 따른다

## 아이콘

* 아이콘은 `lucide-react` 라이브러리만 사용한다
* 아이콘 크기는 Tailwind 클래스로 지정한다 (예: `h-5 w-5`, `h-8 w-8`)

## 알림 (Toast)

* 토스트 알림은 `sonner` 라이브러리의 `toast`를 사용한다
* 성공: `toast.success()`, 에러: `toast.error()`
