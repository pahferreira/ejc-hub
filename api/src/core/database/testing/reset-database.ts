import { sql } from 'drizzle-orm'
import type { Database } from '../client.ts'

// Empties every table the migrations created, so each DB spec starts from an
// empty schema. Drizzle's migration journal lives in the `drizzle` schema and is
// left alone. Seed rows a migration inserted are gone too: a spec inserts what
// it needs.
export async function resetDatabase(db: Database) {
  const { rows } = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`
  )

  if (rows.length === 0) {
    return
  }

  const tables = rows.map((row) => `"public"."${row.tablename}"`).join(', ')
  await db.execute(sql.raw(`truncate table ${tables} restart identity cascade`))
}
