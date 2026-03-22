import { cn } from './utils'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
  as?: 'pre' | 'div'
  mono?: boolean
}

export function CodeBlock({
  children,
  className,
  as: Component = 'pre',
  mono = Component === 'pre',
}: CodeBlockProps) {
  return (
    <Component
      className={cn(
        // 크기/간격
        'rounded-md p-3',
        // 색상/배경
        'bg-muted',
        // 레이아웃
        'overflow-auto text-sm',
        // 폰트
        mono && 'font-mono',
        className,
      )}
    >
      {children}
    </Component>
  )
}
