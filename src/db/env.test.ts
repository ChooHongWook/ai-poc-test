import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { DEFAULT_DATABASE_URL, getDatabaseUrl } from './env'

const originalDatabaseUrl = process.env.DATABASE_URL
const originalCwd = process.cwd()
let tempCwd: string | null = null

afterEach(() => {
  process.chdir(originalCwd)

  if (tempCwd) {
    rmSync(tempCwd, { recursive: true, force: true })
    tempCwd = null
  }

  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl
  }
})

describe('database environment helpers', () => {
  function useEmptyWorkingDirectory(): void {
    tempCwd = mkdtempSync(join(tmpdir(), 'ai-poc-db-env-'))
    process.chdir(tempCwd)
  }

  it('throws when DATABASE_URL is missing and fallback is disabled', () => {
    useEmptyWorkingDirectory()
    delete process.env.DATABASE_URL

    expect(() => getDatabaseUrl()).toThrow('DATABASE_URL')
  })

  it('uses the local compose default when fallback is enabled', () => {
    useEmptyWorkingDirectory()
    delete process.env.DATABASE_URL

    expect(getDatabaseUrl({ fallbackToDefault: true })).toBe(
      DEFAULT_DATABASE_URL,
    )
  })
})
