# Technical Stack

## Runtime & Build

| Category | Technology | Version |
|----------|-----------|---------|
| Build Tool | Vite | 6.3.5 |
| Language | TypeScript | 5.9.3 |
| Runtime | React | 19.2.4 |
| Package Manager | pnpm | - |

## UI Framework

| Category | Technology | Version |
|----------|-----------|---------|
| CSS | Tailwind CSS | 4.1.12 |
| Component Library | shadcn/ui (Radix UI) | Latest |
| Additional UI | MUI Material | 7.3.5 |
| Emotion | @emotion/react + styled | 11.14.x |
| Icons | lucide-react | 0.487.0 |
| Toast | sonner | 2.0.3 |
| Charts | recharts | 2.15.2 |

## Libraries

| Category | Technology | Version |
|----------|-----------|---------|
| Routing | react-router | 7.13.0 (installed, unused) |
| Forms | react-hook-form | 7.55.0 |
| DnD | react-dnd | 16.0.1 |
| Animation | motion | 12.23.24 |
| Date | date-fns | 3.6.0 |
| Theme | next-themes | 0.4.6 |
| Class Merge | clsx + tailwind-merge | Latest |
| CVA | class-variance-authority | 0.7.1 |

## Development Tools

| Category | Technology |
|----------|-----------|
| Formatting | Prettier + prettier-plugin-tailwindcss |
| Type Checking | TypeScript strict mode |
| Vite Plugins | @vitejs/plugin-react, @tailwindcss/vite |

## Key Patterns

- **State Management**: React useState (no external library)
- **Styling**: Tailwind utility-first + CSS variables (OKLch color model)
- **Component Architecture**: shadcn/ui pattern (copy-paste components)
- **Dark Mode**: CSS class toggle (.dark) with CSS variables
- **API**: Mock only (no real API integration)
- **Routing**: None (single page)

## Constraints & Notes

- React peer dependency: 19.2.4 (latest)
- MUI and shadcn/ui coexist (potential cleanup target)
- react-router installed but not used
- next-themes installed (for theme management) despite no Next.js
- No testing framework configured
- No linting (ESLint) configured
