name: moai-library-shadcn-theming
description: shadcn/ui 테마 시스템 및 디자인 토큰 커스터마이징

## 테마 시스템 구현

### 고급 테마 프로바이더

```typescript
// CSS 변수와 다크 모드를 활용한 고급 테마 시스템
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
 children: React.ReactNode;
 defaultTheme?: Theme;
 storageKey?: string;
 attribute?: string;
 enableSystem?: boolean;
}

interface ThemeProviderState {
 theme: Theme;
 setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
 children,
 defaultTheme = "system",
 storageKey = "ui-theme",
 attribute = "class",
 enableSystem = true,
 ...props
}: ThemeProviderProps) {
 const [theme, setTheme] = useState<Theme>(() => {
 if (typeof window !== "undefined") {
 return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
 }
 return defaultTheme;
 });

 useEffect(() => {
 const root = window.document.documentElement;

 root.classList.remove("light", "dark");

 if (theme === "system" && enableSystem) {
 const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
 .matches
 ? "dark"
 : "light";

 root.classList.add(systemTheme);
 return;
 }

 root.classList.add(theme);
 }, [theme, enableSystem, attribute]);

 const value = {
 theme,
 setTheme: (theme: Theme) => {
 localStorage.setItem(storageKey, theme);
 setTheme(theme);
 },
 };

 return (
 <ThemeProviderContext.Provider {...props} value={value}>
 {children}
 </ThemeProviderContext.Provider>
 );
}

export const useTheme = () => {
 const context = useContext(ThemeProviderContext);

 if (context === undefined)
 throw new Error("useTheme must be used within a ThemeProvider");

 return context;
};
```

### 디자인 토큰 설정

```typescript
// 디자인 토큰을 활용한 테마 설정
export const theme = {
 light: {
 background: "hsl(0 0% 100%)",
 foreground: "hsl(240 10% 3.9%)",
 card: "hsl(0 0% 100%)",
 cardForeground: "hsl(240 10% 3.9%)",
 popover: "hsl(0 0% 100%)",
 popoverForeground: "hsl(240 10% 3.9%)",
 primary: "hsl(240 9% 10%)",
 primaryForeground: "hsl(0 0% 98%)",
 secondary: "hsl(240 4.8% 95.9%)",
 secondaryForeground: "hsl(240 3.8% 46.1%)",
 muted: "hsl(240 4.8% 95.9%)",
 mutedForeground: "hsl(240 3.8% 46.1%)",
 accent: "hsl(240 4.8% 95.9%)",
 accentForeground: "hsl(240 5.9% 10%)",
 destructive: "hsl(0 72.22% 50.59%)",
 destructiveForeground: "hsl(0 0% 98%)",
 border: "hsl(240 5.9% 90%)",
 input: "hsl(240 5.9% 90%)",
 ring: "hsl(240 5.9% 10%)",
 },
 dark: {
 background: "hsl(240 10% 3.9%)",
 foreground: "hsl(0 0% 98%)",
 card: "hsl(240 10% 3.9%)",
 cardForeground: "hsl(0 0% 98%)",
 popover: "hsl(240 10% 3.9%)",
 popoverForeground: "hsl(0 0% 98%)",
 primary: "hsl(0 0% 98%)",
 primaryForeground: "hsl(240 9% 10%)",
 secondary: "hsl(240 3.7% 15.9%)",
 secondaryForeground: "hsl(0 0% 98%)",
 muted: "hsl(240 3.7% 15.9%)",
 mutedForeground: "hsl(240 5% 64.9%)",
 accent: "hsl(240 3.7% 15.9%)",
 accentForeground: "hsl(0 0% 98%)",
 destructive: "hsl(0 62.8% 30.6%)",
 destructiveForeground: "hsl(0 0% 98%)",
 border: "hsl(240 3.7% 15.9%)",
 input: "hsl(240 3.7% 15.9%)",
 ring: "hsl(240 4.9% 83.9%)",
 },
};

// 테마 CSS 변수 적용
export function applyThemeCSS() {
 const root = document.documentElement;

 Object.entries(theme.light).forEach(([key, value]) => {
 root.style.setProperty(`--${key}`, value);
 });
}
```

### globals.css의 CSS 변수

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
 :root {
 --background: 0 0% 100%;
 --foreground: 240 10% 3.9%;
 --card: 0 0% 100%;
 --card-foreground: 240 10% 3.9%;
 --popover: 0 0% 100%;
 --popover-foreground: 240 10% 3.9%;
 --primary: 240 9% 10%;
 --primary-foreground: 0 0% 98%;
 --secondary: 240 4.8% 95.9%;
 --secondary-foreground: 240 3.8% 46.1%;
 --muted: 240 4.8% 95.9%;
 --muted-foreground: 240 3.8% 46.1%;
 --accent: 240 4.8% 95.9%;
 --accent-foreground: 240 5.9% 10%;
 --destructive: 0 72.22% 50.59%;
 --destructive-foreground: 0 0% 98%;
 --border: 240 5.9% 90%;
 --input: 240 5.9% 90%;
 --ring: 240 5.9% 10%;
 --radius: 0.5rem;
 }

 .dark {
 --background: 240 10% 3.9%;
 --foreground: 0 0% 98%;
 --card: 240 10% 3.9%;
 --card-foreground: 0 0% 98%;
 --popover: 240 10% 3.9%;
 --popover-foreground: 0 0% 98%;
 --primary: 0 0% 98%;
 --primary-foreground: 240 9% 10%;
 --secondary: 240 3.7% 15.9%;
 --secondary-foreground: 0 0% 98%;
 --muted: 240 3.7% 15.9%;
 --muted-foreground: 240 5% 64.9%;
 --accent: 240 3.7% 15.9%;
 --accent-foreground: 0 0% 98%;
 --destructive: 0 62.8% 30.6%;
 --destructive-foreground: 0 0% 98%;
 --border: 240 3.7% 15.9%;
 --input: 240 3.7% 15.9%;
 --ring: 240 4.9% 83.9%;
 }
}

@layer base {
 * {
 @apply border-border;
 }
 body {
 @apply bg-background text-foreground;
 }
}
```

### 커스텀 브랜드 테마

```typescript
// 커스텀 브랜드 테마 생성
export function createBrandTheme(brandColors: {
 primary: string;
 secondary: string;
 accent: string;
}) {
 return {
 light: {
 ...theme.light,
 primary: brandColors.primary,
 secondary: brandColors.secondary,
 accent: brandColors.accent,
 },
 dark: {
 ...theme.dark,
 primary: brandColors.primary,
 secondary: brandColors.secondary,
 accent: brandColors.accent,
 },
 };
}

// 커스텀 브랜드 테마 적용
export function applyBrandTheme(brandTheme: typeof theme) {
 const root = document.documentElement;
 const currentTheme = root.classList.contains("dark") ? "dark" : "light";

 Object.entries(brandTheme[currentTheme]).forEach(([key, value]) => {
 root.style.setProperty(`--${key}`, value);
 });
}
```

### 테마 토글 컴포넌트

```typescript
// 테마 토글 컴포넌트
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
 const { setTheme } = useTheme();

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="outline" size="icon">
 <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
 <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
 <span className="sr-only">Toggle theme</span>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setTheme("light")}>
 Light
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("dark")}>
 Dark
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("system")}>
 System
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 );
}
```

### Tailwind 설정

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
 darkMode: ["class"],
 content: [
 './pages//*.{ts,tsx}',
 './components//*.{ts,tsx}',
 './app//*.{ts,tsx}',
 './src//*.{ts,tsx}',
 ],
 theme: {
 container: {
 center: true,
 padding: "2rem",
 screens: {
 "2xl": "1400px",
 },
 },
 extend: {
 colors: {
 border: "hsl(var(--border))",
 input: "hsl(var(--input))",
 ring: "hsl(var(--ring))",
 background: "hsl(var(--background))",
 foreground: "hsl(var(--foreground))",
 primary: {
 DEFAULT: "hsl(var(--primary))",
 foreground: "hsl(var(--primary-foreground))",
 },
 secondary: {
 DEFAULT: "hsl(var(--secondary))",
 foreground: "hsl(var(--secondary-foreground))",
 },
 destructive: {
 DEFAULT: "hsl(var(--destructive))",
 foreground: "hsl(var(--destructive-foreground))",
 },
 muted: {
 DEFAULT: "hsl(var(--muted))",
 foreground: "hsl(var(--muted-foreground))",
 },
 accent: {
 DEFAULT: "hsl(var(--accent))",
 foreground: "hsl(var(--accent-foreground))",
 },
 popover: {
 DEFAULT: "hsl(var(--popover))",
 foreground: "hsl(var(--popover-foreground))",
 },
 card: {
 DEFAULT: "hsl(var(--card))",
 foreground: "hsl(var(--card-foreground))",
 },
 },
 borderRadius: {
 lg: "var(--radius)",
 md: "calc(var(--radius) - 2px)",
 sm: "calc(var(--radius) - 4px)",
 },
 keyframes: {
 "accordion-down": {
 from: { height: 0 },
 to: { height: "var(--radix-accordion-content-height)" },
 },
 "accordion-up": {
 from: { height: "var(--radix-accordion-content-height)" },
 to: { height: 0 },
 },
 },
 animation: {
 "accordion-down": "accordion-down 0.2s ease-out",
 "accordion-up": "accordion-up 0.2s ease-out",
 },
 },
 },
 plugins: [require("tailwindcss-animate")],
}
```

---

---

## Tailwind CSS v4 참고사항

Tailwind CSS v4는 CSS 우선 설정 방식을 도입합니다. v3에서의 주요 변경사항:

- 설정을 `tailwind.config.js` 대신 CSS의 `@theme` 디렉티브로 수행
- `@tailwind base/components/utilities` 대신 `@import "tailwindcss"`로 임포트
- CSS 변수를 활용한 디자인 토큰이 v4 아키텍처와 더 자연스럽게 통합
- 위의 `@layer base` 방식은 여전히 호환됨; 새로운 v4 프로젝트에는 `@theme` 사용

```css
/* Tailwind v4 CSS 우선 설정 */
@import "tailwindcss";

@theme {
  --color-primary: hsl(240 9% 10%);
  --color-background: hsl(0 0% 100%);
  --radius: 0.5rem;
}
```

## Nova 프리셋

Nova 프리셋은 Pencil MCP를 통해 사용할 수 있는 shadcn/ui 기반 디자인 시스템 프리셋입니다. 기본 아이콘 라이브러리로 Hugeicons를 사용하며 사전 빌드된 컴포넌트 테마를 제공합니다.

Nova 프리셋 세부사항 및 .pen 파일 워크플로우는 moai-design-tools 스킬을 참조하세요:
- reference/pencil-renderer.md - Pencil DNA 렌더링 및 Nova 설정
- reference/pencil-code.md - Nova 디자인에서 코드 내보내기

---

최종 업데이트: 2026-03-11
관련 문서: [메인 스킬](../SKILL.md), [컴포넌트 아키텍처](component-architecture.md)
