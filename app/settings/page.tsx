'use client'

import { ProviderCard } from './_components/ProviderCard'

// AI 제공자 설정 페이지
export default function SettingsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold">AI 제공자 설정</h2>
      <div className="max-w-2xl space-y-6">
        <ProviderCard name="chatgpt" label="ChatGPT (OpenAI)" />
        <ProviderCard name="gemini" label="Gemini (Google)" />
        <ProviderCard name="claude" label="Claude (Anthropic)" />
      </div>
    </main>
  )
}
