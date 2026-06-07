import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import { getDatabaseUrl } from './env'
import * as schema from './schema'

const { Pool } = pg

let pool: pg.Pool | null = null
let db: ReturnType<typeof createDb> | null = null

function createDb() {
  return drizzle(getPool(), { schema })
}

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl({
        fallbackToDefault: process.env.NODE_ENV !== 'production',
      }),
    })
  }

  return pool
}

export function getDb(): ReturnType<typeof createDb> {
  db ??= createDb()
  return db
}

export async function closeDb(): Promise<void> {
  if (!pool) return

  await pool.end()
  pool = null
  db = null
}
