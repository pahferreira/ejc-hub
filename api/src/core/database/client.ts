import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '../envs/env.ts'

export const db = drizzle(env.DATABASE_URL, {
  casing: 'snake_case',
})

export type Database = typeof db

// The handle passed to a `db.transaction` callback. Repository write methods
// accept either `db` or a transaction so callers can compose them atomically.
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export type DbExecutor = Database | Transaction

// Runs `fn` inside a single database transaction, rolling back if it throws.
export function runInTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(fn)
}
