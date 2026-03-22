'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sparkles, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 헤더 네비게이션 링크 목록
const navLinks = [
  { href: '/', label: '홈' },
  { href: '/upload-test', label: '파일 분석 테스트' },
  { href: '/history', label: '히스토리' },
  { href: '/settings', label: '설정' },
]

export default function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  // 다크/라이트 모드 토글
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="bg-card border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* 로고 및 제목 */}
          <div className="flex items-center gap-3">
            <Sparkles className="text-primary h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">AI 문서 생성 POC</h1>
              <p className="text-muted-foreground text-sm">
                AI 기반 자동 문서 생성 시스템 개념 검증
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 네비게이션 링크 */}
            <nav className="flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    pathname === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* 다크모드 토글 버튼 */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label="다크모드 토글"
            >
              <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
