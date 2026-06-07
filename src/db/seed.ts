import { count } from 'drizzle-orm'

import { closeDb, getDb } from './client'
import { ragDocuments } from './schema'

async function main(): Promise<void> {
  const db = getDb()
  const [row] = await db.select({ count: count() }).from(ragDocuments)

  console.log(`Seed complete: ${row?.count ?? 0} existing RAG document(s).`)
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
  })
