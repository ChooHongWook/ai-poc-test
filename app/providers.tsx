'use client';

import { ThemeProvider } from 'next-themes';

// 클라이언트 전용 providers 래퍼
// next-themes는 클라이언트 컴포넌트가 필요하므로 별도 파일로 분리
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
