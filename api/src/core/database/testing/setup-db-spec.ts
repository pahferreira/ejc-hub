import { afterAll, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { db } from '../client.ts'
import { resetDatabase } from './reset-database.ts'

// Loaded before every DB spec file. `db` is the app's own client: the db project
// points DATABASE_URL at TEST_DATABASE_URL, so repositories run unchanged.
beforeEach(async () => {
  await resetDatabase(db)
})

// `drizzle(url)` builds a Pool; its type also admits a PoolClient, which has no
// `end`. Ending it lets the file's connections close before the next file runs.
afterAll(async () => {
  await (db.$client as Pool).end()
})
