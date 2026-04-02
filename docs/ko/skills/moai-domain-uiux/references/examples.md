# UI/UX 구현 예제

React 19, Vue 3.5, 디자인 토큰, 접근성에 걸친 핵심 UI/UX 패턴을 보여주는 실전 코드 예제입니다.

---

## 1. Button 컴포넌트 (React 19)

### 기본 구현

```typescript
import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
 // 기본 스타일
 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
 {
 variants: {
 variant: {
 default: 'bg-primary text-primary-foreground hover:bg-primary/90',
 destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
 outline: 'border border-input bg-background hover:bg-accent',
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
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant, size, ...props }, ref) => {
 return (
 <button
 className={buttonVariants({ variant, size, className })}
 ref={ref}
 {...props}
 />
 )
 }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

### 사용 예시

```tsx
import { Button } from '@/components/ui/button'

<Button>기본 버튼</Button>
<Button variant="destructive">삭제</Button>
<Button variant="outline" size="sm">작은 아웃라인</Button>
<Button variant="ghost" size="icon">
 <SearchIcon className="h-4 w-4" />
</Button>
```

---

## 2. 유효성 검사가 포함된 폼 (React Hook Form + Zod)

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
 Form,
 FormControl,
 FormDescription,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

// 스키마 정의
const formSchema = z.object({
 username: z.string().min(2, {
 message: '사용자명은 최소 2자 이상이어야 합니다.',
 }),
 email: z.string().email({
 message: '유효한 이메일 주소를 입력해주세요.',
 }),
 password: z.string().min(8, {
 message: '비밀번호는 최소 8자 이상이어야 합니다.',
 }),
})

type FormValues = z.infer<typeof formSchema>

export function SignupForm() {
 const form = useForm<FormValues>({
 resolver: zodResolver(formSchema),
 defaultValues: {
 username: '',
 email: '',
 password: '',
 },
 })

 function onSubmit(values: FormValues) {
 console.log(values)
 }

 return (
 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
 <FormField
 control={form.control}
 name="username"
 render={({ field }) => (
 <FormItem>
 <FormLabel>사용자명</FormLabel>
 <FormControl>
 <Input placeholder="johndoe" {...field} />
 </FormControl>
 <FormDescription>
 공개 표시 이름입니다.
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="email"
 render={({ field }) => (
 <FormItem>
 <FormLabel>이메일</FormLabel>
 <FormControl>
 <Input type="email" placeholder="john@example.com" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="password"
 render={({ field }) => (
 <FormItem>
 <FormLabel>비밀번호</FormLabel>
 <FormControl>
 <Input type="password" placeholder="........" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <Button type="submit">제출</Button>
 </form>
 </Form>
 )
}
```

---

## 3. 데이터 테이블 (TanStack Table)

```typescript
import { useState } from 'react'
import {
 useReactTable,
 getCoreRowModel,
 getSortedRowModel,
 getFilteredRowModel,
 getPaginationRowModel,
 flexRender,
 type ColumnDef,
 type SortingState,
 type ColumnFiltersState,
} from '@tanstack/react-table'

// 데이터 타입 정의
type Payment = {
 id: string
 amount: number
 status: 'pending' | 'processing' | 'success' | 'failed'
 email: string
}

// 컬럼 정의
export const columns: ColumnDef<Payment>[] = [
 {
 accessorKey: 'status',
 header: '상태',
 },
 {
 accessorKey: 'email',
 header: '이메일',
 },
 {
 accessorKey: 'amount',
 header: () => <div className="text-right">금액</div>,
 cell: ({ row }) => {
 const amount = parseFloat(row.getValue('amount'))
 const formatted = new Intl.NumberFormat('en-US', {
 style: 'currency',
 currency: 'USD',
 }).format(amount)
 return <div className="text-right font-medium">{formatted}</div>
 },
 },
]

export function DataTableDemo() {
 const [data] = useState<Payment[]>([
 {
 id: '728ed52f',
 amount: 100,
 status: 'pending',
 email: 'm@example.com',
 },
 // ... 추가 데이터
 ])

 const [sorting, setSorting] = useState<SortingState>([])
 const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

 const table = useReactTable({
 data,
 columns,
 getCoreRowModel: getCoreRowModel(),
 getSortedRowModel: getSortedRowModel(),
 getFilteredRowModel: getFilteredRowModel(),
 getPaginationRowModel: getPaginationRowModel(),
 onSortingChange: setSorting,
 onColumnFiltersChange: setColumnFilters,
 state: {
 sorting,
 columnFilters,
 },
 })

 return (
 <div className="rounded-md border">
 <table className="min-w-full divide-y divide-gray-200">
 <thead>
 {table.getHeaderGroups().map((headerGroup) => (
 <tr key={headerGroup.id}>
 {headerGroup.headers.map((header) => (
 <th key={header.id} className="px-6 py-3 text-left">
 {header.isPlaceholder
 ? null
 : flexRender(
 header.column.columnDef.header,
 header.getContext()
 )}
 </th>
 ))}
 </tr>
 ))}
 </thead>
 <tbody>
 {table.getRowModel().rows.map((row) => (
 <tr key={row.id}>
 {row.getVisibleCells().map((cell) => (
 <td key={cell.id} className="px-6 py-4">
 {flexRender(cell.column.columnDef.cell, cell.getContext())}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )
}
```

---

## 4. 테마 프로바이더 (라이트/다크 모드)

```typescript
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
 children: React.ReactNode
 defaultTheme?: Theme
 storageKey?: string
}

type ThemeProviderState = {
 theme: Theme
 setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
 undefined
)

export function ThemeProvider({
 children,
 defaultTheme = 'system',
 storageKey = 'ui-theme',
 ...props
}: ThemeProviderProps) {
 const [theme, setTheme] = useState<Theme>(
 () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
 )

 useEffect(() => {
 const root = window.document.documentElement
 root.classList.remove('light', 'dark')

 if (theme === 'system') {
 const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
 .matches
 ? 'dark'
 : 'light'
 root.classList.add(systemTheme)
 return
 }

 root.classList.add(theme)
 }, [theme])

 const value = {
 theme,
 setTheme: (theme: Theme) => {
 localStorage.setItem(storageKey, theme)
 setTheme(theme)
 },
 }

 return (
 <ThemeProviderContext.Provider {...props} value={value}>
 {children}
 </ThemeProviderContext.Provider>
 )
}

export const useTheme = () => {
 const context = useContext(ThemeProviderContext)
 if (context === undefined)
 throw new Error('useTheme must be used within a ThemeProvider')
 return context
}

// 사용법
function ThemeToggle() {
 const { setTheme } = useTheme()

 return (
 <div>
 <button onClick={() => setTheme('light')}>라이트</button>
 <button onClick={() => setTheme('dark')}>다크</button>
 <button onClick={() => setTheme('system')}>시스템</button>
 </div>
 )
}
```

---

## 5. 아이콘 사용 패턴

```typescript
import { Heart, Search, Settings } from 'lucide-react'
import { FC, SVGProps } from 'react'

// 타입 안전 아이콘 버튼
type IconType = FC<SVGProps<SVGSVGElement>>

interface IconButtonProps {
 icon: IconType
 label: string
 onClick?: () => void
}

function IconButton({ icon: Icon, label, onClick }: IconButtonProps) {
 return (
 <button
 onClick={onClick}
 aria-label={label}
 className="p-2 rounded-lg hover:bg-gray-100"
 >
 <Icon className="w-5 h-5" />
 </button>
 )
}

// 사용 예시
export function IconExamples() {
 return (
 <div className="flex gap-2">
 {/* 기본 아이콘 */}
 <Heart size={24} color="#ef4444" />
 <Search className="w-6 h-6 text-gray-500" />
 <Settings size={20} />

 {/* 아이콘 버튼 */}
 <IconButton icon={Heart} label="좋아요" onClick={() => console.log('Liked')} />
 <IconButton icon={Search} label="검색" />
 <IconButton icon={Settings} label="설정" />
 </div>
 )
}
```

---

## 6. 접근성을 갖춘 모달 대화상자

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function AccessibleDialog() {
 return (
 <Dialog>
 <DialogTrigger asChild>
 <Button>대화상자 열기</Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>계정 삭제</DialogTitle>
 </DialogHeader>
 <p className="text-sm text-muted-foreground">
 정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
 </p>
 <div className="flex justify-end gap-2">
 <Button variant="outline">취소</Button>
 <Button variant="destructive">삭제</Button>
 </div>
 </DialogContent>
 </Dialog>
 )
}
```

---

## 7. Vue 3.5 Composition API 예제

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const schema = toTypedSchema(
 z.object({
 email: z.string().email('유효하지 않은 이메일 주소입니다'),
 password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
 })
)

const { defineComponentBinds, handleSubmit, errors } = useForm({
 validationSchema: schema,
})

const email = defineComponentBinds('email')
const password = defineComponentBinds('password')

const onSubmit = handleSubmit((values) => {
 console.log('폼 제출:', values)
})
</script>

<template>
 <form @submit="onSubmit" class="space-y-4">
 <div>
 <label for="email">이메일</label>
 <input
 id="email"
 v-bind="email"
 type="email"
 class="border rounded px-3 py-2 w-full"
 />
 <span v-if="errors.email" class="text-red-500 text-sm">
 {{ errors.email }}
 </span>
 </div>

 <div>
 <label for="password">비밀번호</label>
 <input
 id="password"
 v-bind="password"
 type="password"
 class="border rounded px-3 py-2 w-full"
 />
 <span v-if="errors.password" class="text-red-500 text-sm">
 {{ errors.password }}
 </span>
 </div>

 <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">
 제출
 </button>
 </form>
</template>
```

---

## 8. 디자인 토큰 구현

```typescript
// tokens/colors.ts
export const colors = {
 primary: {
 50: '#eff6ff',
 100: '#dbeafe',
 500: '#3b82f6',
 900: '#1e3a8a',
 },
 semantic: {
 text: {
 primary: 'var(--color-text-primary)',
 secondary: 'var(--color-text-secondary)',
 },
 background: {
 default: 'var(--color-bg-default)',
 elevated: 'var(--color-bg-elevated)',
 },
 },
} as const

// 컴포넌트에서의 사용
import { colors } from '@/tokens/colors'

<div style={{ color: colors.semantic.text.primary }}>
 시맨틱 토큰을 사용한 텍스트
</div>
```

---

최종 업데이트: 2025-11-26
상태: 프로덕션 준비 완료
