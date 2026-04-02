name: moai-foundation-uiux-accessibility
description: WCAG 2.2 준수, 테스트, 키보드 내비게이션

## WCAG 2.2 접근성 구현

### 색상 대비 검증

```typescript
// utils/a11y/contrast.ts
/**
 * WCAG 준수를 위한 상대 휘도를 계산합니다
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */
function getLuminance(rgb: [number, number, number]): number {
 const [r, g, b] = rgb.map(val => {
 const sRGB = val / 255;
 return sRGB <= 0.03928
 ? sRGB / 12.92
 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
 });
 return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 두 색상 간의 대비 비율을 계산합니다
 * WCAG AA: 4.5:1 (일반 텍스트), 3:1 (큰 텍스트)
 * WCAG AAA: 7:1 (일반 텍스트), 4.5:1 (큰 텍스트)
 */
export function getContrastRatio(
 foreground: string,
 background: string
): number {
 const fgLum = getLuminance(hexToRgb(foreground));
 const bgLum = getLuminance(hexToRgb(background));
 const lighter = Math.max(fgLum, bgLum);
 const darker = Math.min(fgLum, bgLum);
 return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 색상 조합이 WCAG AA/AAA 요구사항을 충족하는지 확인합니다
 */
export function meetsWCAG(
 foreground: string,
 background: string,
 level: 'AA' | 'AAA' = 'AA',
 isLargeText: boolean = false
): boolean {
 const ratio = getContrastRatio(foreground, background);

 if (level === 'AAA') {
 return isLargeText ? ratio >= 4.5 : ratio >= 7;
 }

 // AA 수준
 return isLargeText ? ratio >= 3 : ratio >= 4.5;
}
```

### 키보드 내비게이션

```typescript
// hooks/useKeyboardNavigation.ts
import { useEffect, useRef } from 'react';

export function useKeyboardNavigation<T extends HTMLElement>(
 options: {
 onEscape?: () => void;
 onEnter?: () => void;
 trapFocus?: boolean;
 } = {}
) {
 const elementRef = useRef<T>(null);

 useEffect(() => {
 const element = elementRef.current;
 if (!element) return;

 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 options.onEscape?.();
 } else if (e.key === 'Enter') {
 options.onEnter?.();
 } else if (e.key === 'Tab' && options.trapFocus) {
 // 포커스 트랩 구현
 const focusableElements = element.querySelectorAll<HTMLElement>(
 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
 );
 const firstElement = focusableElements[0];
 const lastElement = focusableElements[focusableElements.length - 1];

 if (e.shiftKey && document.activeElement === firstElement) {
 lastElement.focus();
 e.preventDefault();
 } else if (!e.shiftKey && document.activeElement === lastElement) {
 firstElement.focus();
 e.preventDefault();
 }
 }
 };

 element.addEventListener('keydown', handleKeyDown);
 return () => element.removeEventListener('keydown', handleKeyDown);
 }, [options]);

 return elementRef;
}
```

### 모션 접근성 (모션 감소)

```css
/* styles/motion.css */
@media (prefers-reduced-motion: reduce) {
 *,
 *::before,
 *::after {
 animation-duration: 0.01ms !important;
 animation-iteration-count: 1 !important;
 transition-duration: 0.01ms !important;
 scroll-behavior: auto !important;
 }
}

/* 모션 감소 사용자를 위한 안전한 애니메이션 */
.fade-enter {
 opacity: 0;
}

.fade-enter-active {
 opacity: 1;
 transition: opacity 200ms ease-in;
}

@media (prefers-reduced-motion: reduce) {
 .fade-enter-active {
 transition: none;
 opacity: 1;
 }
}
```

### 접근성 테스트 자동화

Jest + jest-axe 설정:

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
```

컴포넌트 접근성 테스트:

```typescript
// components/atoms/Button/Button.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from './Button';

describe('Button 접근성', () => {
 it('접근성 위반이 없어야 합니다', async () => {
 const { container } = render(<Button>Click me</Button>);
 const results = await axe(container);
 expect(results).toHaveNoViolations();
 });

 it('비활성화 시 올바른 ARIA 속성을 가져야 합니다', () => {
 const { getByRole } = render(<Button disabled>Disabled</Button>);
 const button = getByRole('button');
 expect(button).toHaveAttribute('aria-disabled', 'true');
 });

 it('로딩 상태를 스크린 리더에 알려야 합니다', () => {
 const { getByRole } = render(<Button isLoading>Loading</Button>);
 const button = getByRole('button');
 expect(button).toHaveAttribute('aria-busy', 'true');
 });
});
```

### 스크린 리더 모범 사례

ARIA 레이블 및 설명:

```typescript
// 예제: 접근성을 갖춘 모달
export function Modal({ title, children, onClose }) {
 const titleId = useId();
 const descriptionId = useId();

 return (
 <div
 role="dialog"
 aria-modal="true"
 aria-labelledby={titleId}
 aria-describedby={descriptionId}
 >
 <h2 id={titleId}>{title}</h2>
 <div id={descriptionId}>{children}</div>
 <button onClick={onClose} aria-label="Close dialog">
 ×
 </button>
 </div>
 );
}
```

동적 콘텐츠를 위한 라이브 영역:

```typescript
// 상태 업데이트 알림
export function StatusAnnouncer({ message }: { message: string }) {
 return (
 <div
 role="status"
 aria-live="polite"
 aria-atomic="true"
 className="sr-only"
 >
 {message}
 </div>
 );
}

// 중요 업데이트를 위한 알림
export function Alert({ message }: { message: string }) {
 return (
 <div
 role="alert"
 aria-live="assertive"
 aria-atomic="true"
 >
 {message}
 </div>
 );
}
```

### 테스트 체크리스트

수동 테스트:
- [ ] 키보드 내비게이션 (Tab, Shift+Tab, Enter, Escape)
- [ ] 스크린 리더 테스트 (NVDA, JAWS, VoiceOver)
- [ ] 색상 대비 검증 (최소 4.5:1)
- [ ] 포커스 인디케이터가 보이고 명확한지 확인
- [ ] 모션 감소 설정 존중 여부 확인

자동화 테스트:
- [ ] jest-axe를 사용한 컴포넌트 접근성 테스트
- [ ] Storybook a11y 애드온을 사용한 시각적 테스트
- [ ] Chromatic을 사용한 시각적 회귀 테스트
- [ ] CI/CD 통합을 통한 지속적 테스트

---

최종 업데이트: 2025-11-26
관련 문서: [메인 스킬](../SKILL.md), [컴포넌트 아키텍처](component-architecture.md)
