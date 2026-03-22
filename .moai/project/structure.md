# Project Structure

## Directory Layout

```
v2_ai-poc-test/
├── index.html                    # HTML entry point
├── package.json                  # Dependencies (pnpm)
├── vite.config.ts                # Vite + React + Tailwind plugins
├── tsconfig.json                 # TypeScript strict mode
├── postcss.config.mjs            # PostCSS (empty, Tailwind v4 handles via plugin)
├── src/
│   ├── main.tsx                  # React 19 entry (createRoot)
│   ├── app/
│   │   ├── App.tsx               # Root component (all state management)
│   │   └── components/
│   │       ├── ConfigurationPanel.tsx    # AI provider config UI
│   │       ├── AIProviderConfigItem.tsx  # Single provider config
│   │       ├── SystemPromptSection.tsx   # System prompt textarea
│   │       ├── UserPromptSection.tsx     # User prompt textarea
│   │       ├── SchemaSection.tsx         # JSON schema editor
│   │       ├── InputDataSection.tsx      # Dynamic input fields
│   │       ├── FileUploadSection.tsx     # Drag-drop file upload
│   │       ├── OutputDataSection.tsx     # Tabbed output display
│   │       ├── AIOutputPreview.tsx       # Single AI output preview
│   │       ├── figma/
│   │       │   └── ImageWithFallback.tsx # Image fallback component
│   │       └── ui/                       # shadcn/ui components (45+)
│   │           ├── button.tsx
│   │           ├── card.tsx
│   │           ├── tabs.tsx
│   │           ├── ... (40+ more)
│   │           ├── utils.ts              # cn() utility
│   │           └── use-mobile.ts         # Mobile detection hook
│   └── styles/
│       ├── index.css             # Main stylesheet imports
│       ├── tailwind.css          # Tailwind v4 config
│       ├── theme.css             # CSS variables (OKLch)
│       └── fonts.css             # Font imports
├── .moai/                        # MoAI orchestrator config
└── .claude/                      # Claude Code rules & skills
```

## Architecture

```
Single Page Application (SPA)
├── Entry: index.html -> main.tsx -> App.tsx
├── State: React useState (all in App.tsx)
├── Layout: 2-column grid (config | output)
├── Components: Feature components + shadcn/ui library
└── Styling: Tailwind CSS v4 + CSS variables
```

## Component Hierarchy

```
App.tsx (root, all state)
├── Header (inline)
├── ConfigurationPanel
│   └── AIProviderConfigItem (x3)
├── SystemPromptSection
├── UserPromptSection
├── SchemaSection
├── InputDataSection
├── FileUploadSection
├── OutputDataSection
│   └── AIOutputPreview (per provider)
└── Footer (inline)
```
