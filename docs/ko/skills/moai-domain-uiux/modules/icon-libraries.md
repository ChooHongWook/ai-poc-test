---
name: moai-foundation-uiux
description: 10개 이상의 주요 라이브러리와 200K+ 아이콘을 다루는 벡터 아이콘 라이브러리 생태계 가이드. React Icons (35K+), Lucide (1000+), Tabler Icons (5900+), Iconify (200K+), Heroicons, Phosphor, Radix Icons의 구현 패턴, 결정 트리, 모범 사례를 포함합니다.
version: 1.0.0
modularized: false
tags:
 - enterprise
 - development
 - vector
updated: 2025-11-24
status: active
---

## 빠른 참조 (30초)

# 아이콘 라이브러리

벡터 아이콘 라이브러리: 엔터프라이즈 가이드 (10개 이상 라이브러리, 200K+ 아이콘)

> 주요 에이전트: frontend-expert
> 보조 에이전트: ui-ux-expert
> 버전: 4.0.0 (Lucide v0.4+, React Icons 35K+, Tabler v2.0+, Phosphor v1.4+)
> 키워드: icons, vector icons, lucide, react icons, iconify, svg icons, accessibility

## 수준 1: 빠른 참조

### 라이브러리 선택 가이드

생태계 리더 (1000개 이상 아이콘):
- Lucide (1000+): 범용 UI, 모던 디자인, ~30KB
- React Icons (35K+): 멀티 라이브러리 지원, 모듈형 번들
- Tabler Icons (5900+): 대시보드 최적화, ~22KB
- Ionicons (1300+): 모바일 + 웹 호환

전문 라이브러리 (300-800개 아이콘):
- Heroicons (300+): Tailwind CSS 공식 아이콘
- Phosphor (800+): 6가지 두께 + 듀오톤 변형
- Material Design (900+): Google 디자인 시스템
- Bootstrap Icons (2000+): Bootstrap 생태계

소형 및 특화:
- Radix Icons (150+): 정밀 15x15px, ~5KB
- Simple Icons (3300+): 브랜드 로고 전용
- Iconify (200K+): 범용 프레임워크, CDN 기반
- Hugeicons (27,000+): Stroke, Solid, Duotone, Twotone, Bulk 스타일 - Nova/shadcn 프리셋 기본값

### 빠른 결정 매트릭스

| 시나리오 | 최적 선택 | 이유 |
|---------|----------|------|
| 최대 아이콘 수가 필요할 때 | Iconify | 150개 이상 세트에서 200K+ 아이콘 |
| 대시보드 애플리케이션 | Tabler Icons | 5900개 최적화 아이콘, 24px |
| Tailwind CSS 프로젝트 | Heroicons | 공식 통합 |
| 유연한 스타일링 필요 | Phosphor | 6가지 두께 + 듀오톤 |
| 최소 번들 크기 | Radix Icons | 5KB, 정밀 15x15px |
| 브랜드 로고 | Simple Icons | 3300개 이상 회사 로고 |
| 범용 UI | Lucide | 1000개 이상 모던, 잘 디자인된 아이콘 |
| Nova/shadcn 프리셋 | Hugeicons | 27K+ 아이콘, 다양한 스타일, Nova 기본값 |

### 번들 크기 비교

```
Radix Icons: ~5KB (150개 아이콘)
Heroicons: ~10KB (300개 아이콘)
Tabler Icons: ~22KB (5900개 아이콘)
Ionicons: ~25KB (1300개 아이콘)
Phosphor: ~25KB (두께 포함 800개 아이콘)
Lucide: ~30KB (1000개 아이콘)
Simple Icons: ~50KB (3300개 이상 브랜드 아이콘)
React Icons: 모듈형 (라이브러리에 따라 다름)
```

## 빠른 설치 명령

```bash
# 핵심 라이브러리
npm install lucide-react
npm install @heroicons/react
npm install @phosphor-icons/react
npm install @tabler/icons-react
npm install @radix-ui/react-icons

# 멀티 라이브러리 지원
npm install react-icons
npm install @iconify/react

# 브랜드 아이콘
npm install simple-icons

# Nova/shadcn 프리셋 기본값
npm install @hugeicons/react
```

버전: 4.0.0 Enterprise
최종 업데이트: 2025-11-13
상태: 프로덕션 준비 완료
엔터프라이즈 등급: 전체 엔터프라이즈 지원

## 구현 가이드

## 수준 2: 실전 구현

### 핵심 라이브러리 패턴

#### Lucide React - 범용 (1000개 이상 아이콘)

```tsx
import { Heart, Search, Settings, ChevronRight } from 'lucide-react'

export function LucideExample() {
 return (
 <div className="space-y-4">
 {/* 기본 사용 (기본값 24px) */}
 <div className="flex items-center gap-2">
 <Search />
 <span>Search</span>
 </div>

 {/* 커스텀 스타일링 */}
 <Heart size={32} color="#ff0000" fill="#ff0000" />

 {/* Tailwind 통합 */}
 <Settings className="w-6 h-6 text-gray-500 hover:text-gray-900" />

 {/* 아이콘 버튼 */}
 <button className="p-2 rounded-lg hover:bg-gray-100">
 <ChevronRight size={20} />
 </button>
 </div>
 )
}
```

#### React Icons - 멀티 라이브러리 (35K+ 아이콘)

```tsx
import { FaHome } from "react-icons/fa" // Font Awesome
import { MdHome } from "react-icons/md" // Material Design
import { BsHouse } from "react-icons/bs" // Bootstrap
import { FiHome } from "react-icons/fi" // Feather
import { SiReact } from "react-icons/si" // 브랜드 로고

export function MultiLibraryExample() {
 return (
 <div className="flex gap-4">
 <FaHome size={32} className="text-blue-600" />
 <MdHome size={32} className="text-green-600" />
 <BsHouse size={32} className="text-purple-600" />
 <FiHome size={32} className="text-orange-600" />
 <SiReact size={32} className="text-cyan-500" />
 </div>
 )
}
```

#### Phosphor Icons - 두께 변형 (800개 이상 아이콘)

```tsx
import { Heart, Star } from "@phosphor-icons/react"

export function PhosphorExample() {
 const [rating, setRating] = React.useState(3)

 return (
 <div className="space-y-4">
 {/* 두께 변형 */}
 <div className="flex gap-2">
 <Heart weight="thin" />
 <Heart weight="light" />
 <Heart weight="regular" />
 <Heart weight="bold" />
 <Heart weight="fill" />
 </div>

 {/* 인터랙티브 평점 */}
 <div className="flex gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <button key={star}>
 <Star
 weight={star <= rating ? "fill" : "regular"}
 size={24}
 color={star <= rating ? "#fbbf24" : "#d1d5db"}
 />
 </button>
 ))}
 </div>
 </div>
 )
}
```

#### Iconify - 범용 프레임워크 (200K+ 아이콘)

```tsx
import { Icon } from "@iconify/react"

export function IconifyExample() {
 return (
 <div className="space-y-4">
 {/* 문자열 기반 (CDN 로드) */}
 <Icon icon="fa:home" width="32" height="32" />
 <Icon icon="mdi:account" width="32" height="32" />
 <Icon icon="bi:house" width="32" height="32" />

 {/* 커스텀 스타일링 */}
 <Icon
 icon="heroicons:heart"
 width="48"
 height="48"
 style={{ color: "#ef4444" }}
 />
 </div>
 )
}
```

### 타입 안전 아이콘 버튼

```tsx
import { FC, SVGProps } from 'react'

type IconType = FC<SVGProps<SVGSVGElement>>

interface IconButtonProps {
 icon: IconType
 label: string
 variant?: 'primary' | 'secondary' | 'ghost'
 size?: 'sm' | 'md' | 'lg'
 onClick?: () => void
}

const sizeMap = {
 sm: 'w-4 h-4',
 md: 'w-5 h-5',
 lg: 'w-6 h-6',
}

const variantMap = {
 primary: 'bg-blue-500 text-white hover:bg-blue-600',
 secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
 ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
}

export function IconButton({
 icon: Icon,
 label,
 variant = 'ghost',
 size = 'md',
 onClick,
}: IconButtonProps) {
 return (
 <button
 onClick={onClick}
 aria-label={label}
 title={label}
 className={`
 p-2 rounded-lg transition-all
 ${variantMap[variant]}
 `}
 >
 <Icon className={sizeMap[size]} />
 </button>
 )
}
```

## 성능 및 모범 사례

### 성능 최적화

```tsx
// 좋음: 특정 아이콘만 트리 쉐이킹
import { Heart, Star } from 'lucide-react'

// 나쁨: 전체 라이브러리 임포트
import * as Icons from 'lucide-react'
const Icon = Icons[iconName]

// 좋음: 대규모 세트에 동적 임포트
const LazyIcon = React.lazy(() => import('lucide-react').then(module => ({
 default: module[iconName]
})))

// 좋음: 컴포넌트 메모이제이션
const MemoHeart = React.memo(Heart)
```

### 번들 최적화 전략

1. 적절한 라이브러리 크기 선택: 최소 번들에는 Radix Icons 사용
2. 특정 아이콘 임포트: `import *` 패턴 지양
3. 동적 로딩: 대규모 세트에서 온디맨드 아이콘 로딩
4. 아이콘 서브셋: 기능별 커스텀 번들 생성
5. 트리 쉐이킹: ES 모듈 및 번들러 최적화 활용

### 접근성 필수사항

- 아이콘 전용 버튼에 `aria-label` 사용
- 4.5:1 색상 대비 비율 보장
- `currentColor`로 고대비 모드 지원
- 의미 전달을 색상에만 의존하지 않기
- 시맨틱 HTML 구조 사용
- 스크린 리더로 테스트

## 라이브러리 비교 요약

| 라이브러리 | 아이콘 수 | 번들 크기 | 최적 용도 |
|-----------|----------|----------|----------|
| Lucide | 1000+ | ~30KB | 범용 UI |
| Heroicons | 300+ | ~10KB | Tailwind CSS 프로젝트 |
| Phosphor | 800+ | ~25KB | 두께 유연성 필요 시 |
| Tabler | 5900+ | ~22KB | 대시보드 애플리케이션 |
| Radix | 150+ | ~5KB | 최소 번들 크기 |
| React Icons | 35K+ | 모듈형 | 멀티 라이브러리 지원 |
| Iconify | 200K+ | CDN | 최대 아이콘 다양성 |

## 고급 패턴

## 수준 3: 고급 통합

### 커스텀 아이콘 컴포넌트

```tsx
import { forwardRef, SVGProps } from 'react'

interface CustomIconProps extends SVGProps<SVGSVGElement> {
 isActive?: boolean
 tooltip?: string
}

export const CustomIcon = forwardRef<SVGSVGElement, CustomIconProps>(
 ({ isActive, tooltip, className = '', ...props }, ref) => (
 <svg
 ref={ref}
 viewBox="0 0 24 24"
 width="24"
 height="24"
 className={`
 ${isActive ? 'text-blue-500' : 'text-gray-400'}
 ${tooltip ? 'cursor-help' : ''}
 ${className}
 transition-colors duration-200
 `}
 title={tooltip}
 {...props}
 >
 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
 </svg>
 )
)
```

### 아이콘 테마 시스템

```tsx
import { Heart, Settings } from 'lucide-react'

type IconTheme = 'light' | 'dark' | 'accent'

interface IconThemeConfig {
 color: string
 strokeWidth: number
 opacity: number
}

const themeConfig: Record<IconTheme, IconThemeConfig> = {
 light: { color: '#e5e7eb', strokeWidth: 2, opacity: 1 },
 dark: { color: '#1f2937', strokeWidth: 2, opacity: 1 },
 accent: { color: '#0ea5e9', strokeWidth: 2.5, opacity: 1 },
}

export function ThemedIcon({ theme, size = 24 }: { theme: IconTheme; size?: number }) {
 const config = themeConfig[theme]

 return (
 <div className="flex gap-4">
 <Heart size={size} color={config.color} strokeWidth={config.strokeWidth} />
 <Settings size={size} color={config.color} strokeWidth={config.strokeWidth} />
 </div>
 )
}
```

### 아이콘 애니메이션

```tsx
import { Heart } from 'lucide-react'
import { useState } from 'react'

export function AnimatedIcon() {
 const [isActive, setIsActive] = useState(false)

 return (
 <button onClick={() => setIsActive(!isActive)} className="p-4">
 <Heart
 size={32}
 className={`
 text-red-500 transition-all duration-300
 ${isActive ? 'scale-125 animate-pulse' : 'scale-100'}
 `}
 fill={isActive ? '#ff0000' : 'none'}
 />
 </button>
 )
}
```

#### Hugeicons - Nova/shadcn 프리셋 기본값 (27,000개 이상 아이콘)

Hugeicons는 Nova 프리셋과 shadcn 기반 디자인 시스템의 기본 아이콘 라이브러리입니다. 각 아이콘에 5가지 시각적 스타일을 제공합니다.

```tsx
import {
 Home01Icon,
 SearchIcon,
 SettingsIcon,
} from '@hugeicons/react'

export function HugeiconsExample() {
 return (
 <div className="space-y-4">
 {/* 기본 stroke 스타일 */}
 <Home01Icon size={24} />

 {/* Solid 스타일 */}
 <SearchIcon size={24} type="solid" />

 {/* Duotone 스타일 */}
 <SettingsIcon size={24} type="duotone" className="text-primary" />
 </div>
 )
}
```

스타일 옵션: `stroke` (기본값), `solid`, `duotone`, `twotone`, `bulk`

아이콘 네이밍 규칙: 변형에 숫자 접미사를 포함한 PascalCase (예: `Home01Icon`, `Home02Icon`).

Hugeicons 사용 시점:
- Nova 프리셋 또는 shadcn/ui 디자인 시스템으로 빌드할 때
- 아이콘당 여러 시각적 두께/스타일 옵션이 필요할 때
- 가장 큰 아이콘 세트(27,000+)가 필요할 때
