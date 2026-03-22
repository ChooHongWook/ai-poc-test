import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { AIConfigProvider } from '@/lib/providers/ai-config-provider'
import { HistoryProvider } from '@/lib/providers/history-provider'
import { MSWProvider } from '@/components/providers/MSWProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI 문서 생성 POC',
  description: 'AI 기반 자동 문서 생성 시스템 개념 검증',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MSWProvider>
            <AIConfigProvider>
              <HistoryProvider>
                <div className="bg-background min-h-screen">
                  <Header />
                  {children}
                  <Footer />
                </div>
              </HistoryProvider>
            </AIConfigProvider>
          </MSWProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
