import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ENV_FILES = ['.env.local', 'db/.env']

export const DEFAULT_DATABASE_URL =
  'postgresql://ai_poc:ai_poc_password@localhost:5432/ai_poc_rag'

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

export function loadDatabaseEnv(): void {
  for (const envFile of ENV_FILES) {
    const filePath = resolve(process.cwd(), envFile)
    if (!existsSync(filePath)) continue

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex === -1) continue

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = stripQuotes(trimmed.slice(separatorIndex + 1).trim())

      process.env[key] ??= value
    }
  }
}

export function getDatabaseUrl(options?: {
  fallbackToDefault?: boolean
}): string {
  loadDatabaseEnv()

  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    return databaseUrl
  }

  if (options?.fallbackToDefault) {
    return DEFAULT_DATABASE_URL
  }

  throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다')
}
