import { cn } from './utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function EmptyState({ icon, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        // 색상/배경
        'text-muted-foreground',
        // 레이아웃
        'text-center',
        // 크기/간격
        'py-8',
        className,
      )}
    >
      {icon && <div className="mx-auto mb-3 flex justify-center">{icon}</div>}
      {children}
    </div>
  )
}
