# 고급 shadcn/ui 컴포넌트 패턴

## 아키텍처 패턴

### 복잡한 컴포넌트 조합

shadcn/ui는 단순하고 재사용 가능한 컴포넌트로 복잡한 UI를 조합하는 데 탁월합니다. 아키텍처는 상속보다 조합 접근 방식을 따릅니다.

패턴: 복합 컴포넌트

```typescript
// shadcn/ui를 사용한 복합 컴포넌트 패턴
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import React, { createContext, useContext } from "react"

// 폼 상태를 위한 컨텍스트 생성
interface FormContextType {
 data: Record<string, any>
 setData: (key: string, value: any) => void
 errors: Record<string, string>
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export function Form({ children, onSubmit }: { children: React.ReactNode; onSubmit: (data: any) => void }) {
 const [data, setData] = React.useState({})
 const [errors, setErrors] = React.useState({})

 return (
 <FormContext.Provider value={{ data, setData: (k, v) => setData(prev => ({ ...prev, [k]: v })), errors }}>
 <form
 onSubmit={(e) => {
 e.preventDefault()
 onSubmit(data)
 }}
 >
 {children}
 </form>
 </FormContext.Provider>
 )
}

export function FormField({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
 const context = useContext(FormContext)
 if (!context) throw new Error("FormField must be used inside Form")

 return (
 <div className="mb-4">
 <label htmlFor={name} className="block text-sm font-medium mb-1">
 {label}
 </label>
 <Input
 id={name}
 type={type}
 value={context.data[name] || ""}
 onChange={(e) => context.setData(name, e.target.value)}
 />
 </div>
 )
}

// 사용법
export function MyForm() {
 return (
 <Form onSubmit={(data) => console.log(data)}>
 <Card>
 <CardHeader>
 <CardTitle>Contact Form</CardTitle>
 <CardDescription>Enter your details</CardDescription>
 </CardHeader>
 <CardContent>
 <FormField label="Name" name="name" />
 <FormField label="Email" name="email" type="email" />
 <Button type="submit">Submit</Button>
 </CardContent>
 </Card>
 </Form>
 )
}
```

### 디자인 토큰 통합

shadcn/ui는 테마 적용을 위해 CSS 변수를 사용합니다. 컴포넌트는 테마 변경에 자동으로 적응합니다.

패턴: 테마 인식 컴포넌트

```typescript
// 커스텀 컴포넌트에서 디자인 토큰 사용
export function StatusBadge({ status }: { status: "success" | "error" | "warning" }) {
 const statusConfig = {
 success: "bg-green-500/20 text-green-700 dark:text-green-400",
 error: "bg-red-500/20 text-red-700 dark:text-red-400",
 warning: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
 }

 return (
 <span className={`px-3 py-1 rounded-md text-sm font-medium ${statusConfig[status]}`}>
 {status.charAt(0).toUpperCase() + status.slice(1)}
 </span>
 )
}

// 컨텍스트를 사용한 테마 전환
import { useEffect, useState } from "react"

export function ThemeSwitcher() {
 const [theme, setTheme] = useState("light")

 useEffect(() => {
 const html = document.documentElement
 if (theme === "dark") {
 html.classList.add("dark")
 } else {
 html.classList.remove("dark")
 }
 }, [theme])

 return (
 <Button
 variant="outline"
 onClick={() => setTheme(theme === "light" ? "dark" : "light")}
 >
 {theme === "light" ? "" : ""}
 </Button>
 )
}
```

## 고급 컴포넌트 패턴

### 유효성 검사를 포함한 폼 조합

shadcn/ui의 Button, Input, Form 컴포넌트는 react-hook-form 같은 유효성 검사 라이브러리와 잘 통합됩니다.

```typescript
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FormData {
 username: string
 email: string
}

export function AdvancedForm() {
 const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
 defaultValues: { username: "", email: "" }
 })

 const onSubmit = (data: FormData) => {
 console.log("폼 제출됨:", data)
 }

 return (
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 <div>
 <Input
 {...register("username", { required: "사용자 이름은 필수입니다" })}
 placeholder="사용자 이름 입력"
 />
 {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
 </div>

 <div>
 <Input
 {...register("email", { required: "이메일은 필수입니다", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "유효하지 않은 이메일" } })}
 placeholder="이메일 입력"
 type="email"
 />
 {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
 </div>

 <Button type="submit">제출</Button>
 </form>
 )
}
```

### 정렬 및 필터링이 포함된 복잡한 데이터 테이블

```typescript
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from "@tanstack/react-table"

export function UserDataTable({ users }: { users: User[] }) {
 const [sorting, setSorting] = React.useState([])
 const [columnFilters, setColumnFilters] = React.useState([])

 const table = useReactTable({
 data: users,
 columns: [
 {
 accessorKey: "name",
 header: "이름",
 },
 {
 accessorKey: "email",
 header: "이메일",
 },
 ],
 getCoreRowModel: getCoreRowModel(),
 getSortedRowModel: getSortedRowModel(),
 getFilteredRowModel: getFilteredRowModel(),
 state: {
 sorting,
 columnFilters,
 },
 onSortingChange: setSorting,
 onColumnFiltersChange: setColumnFilters,
 })

 return (
 <div>
 <Button onClick={() => setColumnFilters([{ id: "name", value: "john" }])}>
 John으로 필터링
 </Button>
 <DataTable table={table} />
 </div>
 )
}
```

## 컴포넌트 조합 전략

### 컴포넌트 트리 구축

shadcn/ui 컴포넌트는 중첩 및 조합하여 복잡한 레이아웃을 만들 수 있습니다.

전략: 계층적 컴포넌트 구조

```typescript
// 부모 래퍼 컴포넌트
export function DashboardLayout({ children }: { children: React.ReactNode }) {
 return (
 <div className="grid grid-cols-4 gap-4 p-6">
 <aside className="col-span-1">
 <Navigation />
 </aside>
 <main className="col-span-3">
 {children}
 </main>
 </div>
 )
}

// 네비게이션 하위 컴포넌트
function Navigation() {
 return (
 <nav className="space-y-2">
 <Button variant="ghost" className="w-full justify-start">대시보드</Button>
 <Button variant="ghost" className="w-full justify-start">설정</Button>
 <Button variant="ghost" className="w-full justify-start">프로필</Button>
 </nav>
 )
}

// 사용법
export function Dashboard() {
 return (
 <DashboardLayout>
 <Card>
 <CardHeader>
 <CardTitle>환영합니다</CardTitle>
 </CardHeader>
 <CardContent>
 대시보드 콘텐츠가 여기에 표시됩니다
 </CardContent>
 </Card>
 </DashboardLayout>
 )
}
```

## 디자인 시스템 확장

### 컴포넌트 변형 관리

shadcn/ui 컴포넌트는 다양한 사용 사례를 위한 변형을 지원합니다.

패턴: 변형 관리

```typescript
// 일관된 인터페이스를 위한 Button 변형 사용
export function ActionButtons() {
 return (
 <div className="flex gap-2">
 <Button variant="default">기본 액션</Button>
 <Button variant="secondary">보조 액션</Button>
 <Button variant="outline">아웃라인 액션</Button>
 <Button variant="destructive">삭제</Button>
 <Button variant="ghost">고스트 액션</Button>
 </div>
 )
}

// 커스텀 크기 변형 만들기
export function SizedButtons() {
 return (
 <div className="flex gap-2 items-center">
 <Button size="sm">작게</Button>
 <Button size="default">기본</Button>
 <Button size="lg">크게</Button>
 </div>
 )
}
```

## 반응형 디자인 패턴

### Tailwind를 활용한 모바일 우선 접근 방식

shadcn/ui는 반응형 브레이크포인트를 지원하는 Tailwind CSS를 사용합니다.

```typescript
export function ResponsiveCard() {
 return (
 <Card className="w-full sm:max-w-sm md:max-w-md lg:max-w-lg">
 <CardHeader className="p-4 sm:p-6">
 <CardTitle className="text-lg sm:text-xl md:text-2xl">
 반응형 카드
 </CardTitle>
 </CardHeader>
 <CardContent className="p-4 sm:p-6">
 <p className="text-sm sm:text-base md:text-lg">
 콘텐츠가 화면 크기에 맞게 적응합니다
 </p>
 </CardContent>
 </Card>
 )
}
```

## 성능 패턴

### 메모이제이션과 지연 로딩

shadcn/ui 컴포넌트는 불필요한 리렌더링을 방지하기 위해 React.memo의 이점을 누릴 수 있습니다.

```typescript
import React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface UserCardProps {
 user: User
}

export const UserCard = React.memo(function UserCard({ user }: UserCardProps) {
 return (
 <Card>
 <CardContent>
 <p>{user.name}</p>
 <p className="text-gray-500">{user.email}</p>
 </CardContent>
 </Card>
 )
})
```

## 접근성 표준

### ARIA 통합

shadcn/ui 컴포넌트는 내장된 접근성 기능을 갖추고 있습니다.

```typescript
export function AccessibleDialog() {
 const [open, setOpen] = React.useState(false)

 return (
 <>
 <Button onClick={() => setOpen(true)} aria-label="다이얼로그 열기">
 열기
 </Button>
 {open && (
 <div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
 <h2 id="dialog-title">다이얼로그 제목</h2>
 <p>다이얼로그 콘텐츠가 여기에 표시됩니다</p>
 <Button onClick={() => setOpen(false)}>닫기</Button>
 </div>
 )}
 </>
 )
}
```

---

버전: 4.0.0
최종 업데이트: 2025-11-22
상태: 프로덕션 준비 완료
