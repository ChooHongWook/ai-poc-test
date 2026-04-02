# 고급 예제 및 프로덕션 패턴

## 예제 1: 완전한 사용자 설정 페이지

```tsx
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import React from "react"

export function UserSettingsPage() {
 const [settings, setSettings] = React.useState({
 emailNotifications: true,
 pushNotifications: false,
 twoFactorAuth: true,
 })

 return (
 <div className="max-w-4xl mx-auto p-6">
 <div className="mb-8">
 <h1 className="text-3xl font-bold mb-2">계정 설정</h1>
 <p className="text-gray-600">계정 및 환경설정을 관리하세요</p>
 </div>

 <Tabs defaultValue="general" className="w-full">
 <TabsList className="grid w-full grid-cols-3">
 <TabsTrigger value="general">일반</TabsTrigger>
 <TabsTrigger value="notifications">알림</TabsTrigger>
 <TabsTrigger value="security">보안</TabsTrigger>
 </TabsList>

 {/* 일반 설정 */}
 <TabsContent value="general">
 <Card>
 <CardHeader>
 <CardTitle>프로필 정보</CardTitle>
 <CardDescription>
 프로필 세부 정보를 업데이트하세요
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium mb-2">
 이름
 </label>
 <Input placeholder="길동" />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">
 성
 </label>
 <Input placeholder="홍" />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium mb-2">
 이메일
 </label>
 <Input type="email" placeholder="john@example.com" />
 </div>

 <div>
 <label className="block text-sm font-medium mb-2">
 소개
 </label>
 <textarea
 placeholder="자기소개를 작성해 주세요..."
 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 </div>

 <Button>변경사항 저장</Button>
 </CardContent>
 </Card>
 </TabsContent>

 {/* 알림 */}
 <TabsContent value="notifications">
 <Card>
 <CardHeader>
 <CardTitle>알림 환경설정</CardTitle>
 <CardDescription>
 알림 수신 방법을 제어하세요
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 {[
 {
 key: 'emailNotifications',
 label: '이메일 알림',
 description: '이메일 업데이트를 수신합니다'
 },
 {
 key: 'pushNotifications',
 label: '푸시 알림',
 description: '푸시 알림을 수신합니다'
 },
 ].map((notif) => (
 <div
 key={notif.key}
 className="flex items-center justify-between py-4 border-b last:border-b-0"
 >
 <div>
 <p className="font-medium">{notif.label}</p>
 <p className="text-sm text-gray-600">
 {notif.description}
 </p>
 </div>
 <Switch
 checked={settings[notif.key]}
 onCheckedChange={(checked) =>
 setSettings({
 ...settings,
 [notif.key]: checked,
 })
 }
 />
 </div>
 ))}

 <Button className="mt-6">환경설정 저장</Button>
 </CardContent>
 </Card>
 </TabsContent>

 {/* 보안 */}
 <TabsContent value="security">
 <Card>
 <CardHeader>
 <CardTitle>보안 설정</CardTitle>
 <CardDescription>
 계정 보안을 관리하세요
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="flex items-center justify-between py-4 border-b">
 <div>
 <p className="font-medium">2단계 인증</p>
 <p className="text-sm text-gray-600">
 계정에 추가 보안을 적용합니다
 </p>
 </div>
 <Badge variant={settings.twoFactorAuth ? "default" : "outline"}>
 {settings.twoFactorAuth ? "활성화됨" : "비활성화됨"}
 </Badge>
 </div>

 <div>
 <Button variant="outline">비밀번호 변경</Button>
 </div>

 <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
 <h3 className="font-semibold text-red-900 mb-2">
 위험 영역
 </h3>
 <p className="text-sm text-red-800 mb-4">
 계정을 삭제하면 되돌릴 수 없습니다.
 </p>
 <Button variant="destructive" size="sm">
 계정 삭제
 </Button>
 </div>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>
 )
}
```

## 예제 2: 정렬 및 필터링이 포함된 데이터 테이블

```tsx
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"
import React from "react"

interface User {
 id: string
 name: string
 email: string
 status: "active" | "inactive"
 joinDate: string
}

const users: User[] = [
 {
 id: "1",
 name: "Alice Johnson",
 email: "alice@example.com",
 status: "active",
 joinDate: "2025-01-15"
 },
 {
 id: "2",
 name: "Bob Smith",
 email: "bob@example.com",
 status: "active",
 joinDate: "2025-02-20"
 },
 {
 id: "3",
 name: "Charlie Brown",
 email: "charlie@example.com",
 status: "inactive",
 joinDate: "2025-03-10"
 },
]

export function UserTable() {
 const [searchTerm, setSearchTerm] = React.useState("")
 const [statusFilter, setStatusFilter] = React.useState("all")
 const [sortBy, setSortBy] = React.useState("name")

 const filtered = users.filter((user) => {
 const matchesSearch = user.name
 .toLowerCase()
 .includes(searchTerm.toLowerCase())
 const matchesStatus =
 statusFilter === "all" || user.status === statusFilter
 return matchesSearch && matchesStatus
 })

 const sorted = [...filtered].sort((a, b) => {
 switch (sortBy) {
 case "name":
 return a.name.localeCompare(b.name)
 case "date":
 return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
 default:
 return 0
 }
 })

 return (
 <div className="space-y-4">
 {/* 컨트롤 */}
 <div className="flex gap-4 flex-wrap">
 <Input
 placeholder="사용자 검색..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="flex-1 min-w-[200px]"
 />

 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-[150px]">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">전체 상태</SelectItem>
 <SelectItem value="active">활성</SelectItem>
 <SelectItem value="inactive">비활성</SelectItem>
 </SelectContent>
 </Select>

 <Select value={sortBy} onValueChange={setSortBy}>
 <SelectTrigger className="w-[150px]">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="name">이름순 정렬</SelectItem>
 <SelectItem value="date">날짜순 정렬</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* 테이블 */}
 <div className="border rounded-lg">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>이름</TableHead>
 <TableHead>이메일</TableHead>
 <TableHead>상태</TableHead>
 <TableHead>가입일</TableHead>
 <TableHead>작업</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {sorted.map((user) => (
 <TableRow key={user.id}>
 <TableCell className="font-medium">{user.name}</TableCell>
 <TableCell>{user.email}</TableCell>
 <TableCell>
 <span
 className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
 user.status === "active"
 ? "bg-green-100 text-green-800"
 : "bg-gray-100 text-gray-800"
 }`}
 >
 {user.status}
 </span>
 </TableCell>
 <TableCell>{user.joinDate}</TableCell>
 <TableCell>
 <Button size="sm" variant="ghost">
 편집
 </Button>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>

 {sorted.length === 0 && (
 <div className="text-center py-8 text-gray-500">
 조건에 맞는 사용자를 찾을 수 없습니다
 </div>
 )}
 </div>
 )
}
```

## 예제 3: 반응형 모바일 네비게이션

```tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
 Sheet,
 SheetContent,
 SheetDescription,
 SheetHeader,
 SheetTitle,
 SheetTrigger,
} from "@/components/ui/sheet"

export function MobileNav() {
 const [open, setOpen] = useState(false)

 const navItems = [
 { label: "홈", href: "/" },
 { label: "기능", href: "/features" },
 { label: "요금제", href: "/pricing" },
 { label: "블로그", href: "/blog" },
 { label: "문의", href: "/contact" },
 ]

 return (
 <nav className="flex items-center justify-between p-4 border-b">
 {/* 로고 */}
 <a href="/" className="text-xl font-bold">
 MyApp
 </a>

 {/* 데스크톱 네비게이션 */}
 <div className="hidden md:flex gap-6">
 {navItems.map((item) => (
 <a
 key={item.label}
 href={item.href}
 className="text-sm hover:text-blue-600 transition-colors"
 >
 {item.label}
 </a>
 ))}
 <Button size="sm">로그인</Button>
 </div>

 {/* 모바일 메뉴 */}
 <Sheet open={open} onOpenChange={setOpen}>
 <SheetTrigger asChild className="md:hidden">
 <Button variant="ghost" size="icon">

 </Button>
 </SheetTrigger>
 <SheetContent side="right">
 <SheetHeader>
 <SheetTitle>메뉴</SheetTitle>
 </SheetHeader>
 <div className="space-y-4 mt-6">
 {navItems.map((item) => (
 <a
 key={item.label}
 href={item.href}
 className="block py-2 hover:text-blue-600 transition-colors"
 onClick={() => setOpen(false)}
 >
 {item.label}
 </a>
 ))}
 <Button className="w-full">로그인</Button>
 </div>
 </SheetContent>
 </Sheet>
 </nav>
 )
}
```

## 예제 4: 유효성 검사가 포함된 폼

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import React from "react"

export function SignupForm() {
 const [formData, setFormData] = React.useState({
 email: "",
 password: "",
 confirmPassword: "",
 country: "",
 newsletter: false,
 terms: false,
 })

 const [errors, setErrors] = React.useState({})

 const handleSubmit = (e) => {
 e.preventDefault()
 const newErrors = {}

 if (!formData.email) newErrors.email = "이메일은 필수입니다"
 if (!formData.password) newErrors.password = "비밀번호는 필수입니다"
 if (formData.password !== formData.confirmPassword) {
 newErrors.confirmPassword = "비밀번호가 일치하지 않습니다"
 }
 if (!formData.country) newErrors.country = "국가 선택은 필수입니다"
 if (!formData.terms) newErrors.terms = "약관에 동의해야 합니다"

 setErrors(newErrors)

 if (Object.keys(newErrors).length === 0) {
 console.log("폼 제출됨:", formData)
 }
 }

 return (
 <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1">이메일</label>
 <Input
 type="email"
 placeholder="your@email.com"
 value={formData.email}
 onChange={(e) =>
 setFormData({ ...formData, email: e.target.value })
 }
 />
 {errors.email && (
 <p className="text-red-500 text-sm mt-1">{errors.email}</p>
 )}
 </div>

 <div>
 <label className="block text-sm font-medium mb-1">비밀번호</label>
 <Input
 type="password"
 placeholder="••••••••"
 value={formData.password}
 onChange={(e) =>
 setFormData({ ...formData, password: e.target.value })
 }
 />
 {errors.password && (
 <p className="text-red-500 text-sm mt-1">{errors.password}</p>
 )}
 </div>

 <div>
 <label className="block text-sm font-medium mb-1">
 비밀번호 확인
 </label>
 <Input
 type="password"
 placeholder="••••••••"
 value={formData.confirmPassword}
 onChange={(e) =>
 setFormData({ ...formData, confirmPassword: e.target.value })
 }
 />
 {errors.confirmPassword && (
 <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
 )}
 </div>

 <div>
 <label className="block text-sm font-medium mb-1">국가</label>
 <Select value={formData.country} onValueChange={(value) =>
 setFormData({ ...formData, country: value })
 }>
 <SelectTrigger>
 <SelectValue placeholder="국가를 선택하세요" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="usa">미국</SelectItem>
 <SelectItem value="canada">캐나다</SelectItem>
 <SelectItem value="uk">영국</SelectItem>
 </SelectContent>
 </Select>
 {errors.country && (
 <p className="text-red-500 text-sm mt-1">{errors.country}</p>
 )}
 </div>

 <div className="space-y-2">
 <div className="flex items-center space-x-2">
 <Checkbox
 id="newsletter"
 checked={formData.newsletter}
 onCheckedChange={(checked) =>
 setFormData({ ...formData, newsletter: checked })
 }
 />
 <label htmlFor="newsletter" className="text-sm cursor-pointer">
 뉴스레터 구독
 </label>
 </div>

 <div className="flex items-center space-x-2">
 <Checkbox
 id="terms"
 checked={formData.terms}
 onCheckedChange={(checked) =>
 setFormData({ ...formData, terms: checked })
 }
 />
 <label htmlFor="terms" className="text-sm cursor-pointer">
 이용약관에 동의합니다
 </label>
 </div>

 {errors.terms && (
 <p className="text-red-500 text-sm">{errors.terms}</p>
 )}
 </div>

 <Button type="submit" className="w-full">
 회원가입
 </Button>
 </form>
 )
}
```
