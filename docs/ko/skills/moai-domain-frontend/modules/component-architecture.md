# 컴포넌트 아키텍처

디자인 시스템, 복합 컴포넌트, CVA 배리언트, 접근 가능한 컴포넌트를 포함한 확장 가능한 컴포넌트 시스템 구축을 위한 종합 패턴.

---

## 디자인 시스템 기초

### 토큰 기반 디자인

```typescript
// lib/design-tokens.ts
export const tokens = {
  colors: {
    // 시맨틱 색상
    primary: {
      50: 'hsl(221, 83%, 95%)',
      100: 'hsl(221, 83%, 90%)',
      500: 'hsl(221, 83%, 53%)',
      600: 'hsl(221, 83%, 45%)',
      900: 'hsl(221, 83%, 20%)',
    },
    // 기능별 색상
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    muted: 'hsl(var(--muted))',
    border: 'hsl(var(--border))',
  },

  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
  },

  radii: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },

  typography: {
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
} as const

// CSS 변수 설정
export const cssVariables = `
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --border: 217.2 32.6% 17.5%;
  }
`
```

---

## Class Variance Authority (CVA)

### CVA를 사용한 Button 컴포넌트

```tsx
// components/ui/Button/Button.tsx
import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // 기본 스타일
  [
    'inline-flex items-center justify-center',
    'whitespace-nowrap rounded-md text-sm font-medium',
    'ring-offset-background transition-colors',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className="mr-2 h-4 w-4 animate-spin" />
            로딩 중...
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

### 배리언트가 있는 Input 컴포넌트

```tsx
// components/ui/Input/Input.tsx
import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  [
    'flex w-full rounded-md border bg-background px-3 py-2',
    'text-sm ring-offset-background',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'border-input',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      inputSize: {
        sm: 'h-8 text-xs',
        default: 'h-10',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, error, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          className={cn(
            inputVariants({
              variant: error ? 'error' : variant,
              inputSize,
              className
            })
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }
```

---

## 복합 컴포넌트 패턴

### Card 복합 컴포넌트

```tsx
// components/ui/Card/Card.tsx
import { createContext, useContext, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// 복합 컴포넌트 간 상태 공유를 위한 Context
interface CardContextValue {
  variant: 'default' | 'elevated' | 'outlined'
}

const CardContext = createContext<CardContextValue>({ variant: 'default' })

// 루트 컴포넌트
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'border bg-card text-card-foreground shadow-sm',
      elevated: 'bg-card text-card-foreground shadow-md',
      outlined: 'border-2 bg-transparent',
    }

    return (
      <CardContext.Provider value={{ variant }}>
        <div
          ref={ref}
          className={cn('rounded-lg', variantStyles[variant], className)}
          {...props}
        >
          {children}
        </div>
      </CardContext.Provider>
    )
  }
)
Card.displayName = 'Card'

// 헤더 컴포넌트
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

// 타이틀 컴포넌트
const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

// 설명 컴포넌트
const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

// 콘텐츠 컴포넌트
const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

// 푸터 컴포넌트
const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { variant } = useContext(CardContext)

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center p-6 pt-0',
          variant === 'outlined' && 'border-t mt-4 pt-4',
          className
        )}
        {...props}
      />
    )
  }
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
```

### Tabs 복합 컴포넌트

```tsx
// components/ui/Tabs/Tabs.tsx
import { createContext, useContext, useState, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs 컴포넌트는 Tabs 프로바이더 내부에서 사용해야 합니다')
  }
  return context
}

// 루트
interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value: controlledValue, onValueChange, children, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '')

    const value = controlledValue ?? uncontrolledValue
    const handleValueChange = onValueChange ?? setUncontrolledValue

    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <div ref={ref} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

// TabsList
const TabsList = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = 'TabsList'

// TabsTrigger
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabs()
    const isSelected = selectedValue === value

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        data-state={isSelected ? 'active' : 'inactive'}
        onClick={() => onValueChange(value)}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5',
          'text-sm font-medium ring-offset-background transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          isSelected && 'bg-background text-foreground shadow-sm',
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

// TabsContent
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const { value: selectedValue } = useTabs()
    const isSelected = selectedValue === value

    if (!isSelected) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        data-state={isSelected ? 'active' : 'inactive'}
        className={cn('mt-2 focus-visible:outline-none', className)}
        {...props}
      />
    )
  }
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

---

## 접근 가능한 컴포넌트

### Modal/Dialog 컴포넌트

```tsx
// components/ui/Dialog/Dialog.tsx
import { forwardRef, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* 다이얼로그 */}
      {children}
    </div>,
    document.body
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose: () => void
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onClose, ...props }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null)

    // 포커스 트랩
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const focusableElements = contentRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (!focusableElements || focusableElements.length === 0) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }, [onClose])

    // 마운트 시 자동 포커스
    useEffect(() => {
      const firstFocusable = contentRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement

      firstFocusable?.focus()
    }, [])

    return (
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-lg rounded-lg bg-background p-6 shadow-lg',
          'animate-in fade-in-0 zoom-in-95',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DialogContent.displayName = 'DialogContent'

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
  )
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  )
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
  )
}
```

---

## 컴포넌트 합성

### 유연한 렌더링을 위한 Slot 패턴

```tsx
// components/ui/Slot/Slot.tsx
import { forwardRef, cloneElement, isValidElement, Children } from 'react'

interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export const Slot = forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (isValidElement(children)) {
      return cloneElement(children, {
        ...props,
        ...children.props,
        ref,
      })
    }

    if (Children.count(children) > 1) {
      Children.only(null) // 에러를 발생시킴
    }

    return null
  }
)
Slot.displayName = 'Slot'

// 사용 예시
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} {...props} />
  }
)

// 링크로 렌더링
<Button asChild>
  <a href="/home">홈으로 이동</a>
</Button>
```

---

## 모범 사례

### 컴포넌트 API 설계

일관된 Prop 네이밍:
- variant: 시각적 스타일용
- size: 크기 조절용
- disabled: 비활성화 상태용
- className: 추가 스타일용

Ref 전달:
- DOM 접근을 위해 항상 ref를 전달
- 적절한 타이핑과 함께 forwardRef 사용

설정보다 합성:
- 복합 컴포넌트 패턴 선호
- 개별 컴포넌트는 단일 책임에 집중

### 접근성 체크리스트

필수 속성:
- role: 시맨틱 의미 전달
- aria-label: 아이콘 버튼용
- aria-describedby: 폼 에러 연결
- aria-expanded: 확장 가능한 콘텐츠용

키보드 내비게이션:
- Tab: 포커스 이동
- Enter/Space: 활성화
- Escape: 닫기
- 화살표 키: 선택 이동

---

버전: 2.0.0
최종 업데이트: 2026-01-06
