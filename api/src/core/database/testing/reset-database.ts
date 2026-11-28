import { sql } from 'drizzle-orm'
import pg from 'pg'
import type { Database } from '../client.ts'

// Empties every table the migrations created, so each DB spec starts from an
// empty schema. Drizzle's migration journal lives in the `drizzle` schema and is
// left alone. Seed rows a migration inserted are gone too: a spec inserts what
// it needs.
export async function resetDatabase(db: Database) {
  // The db project's guard checks TEST_DATABASE_URL, but `db` connects to
  // DATABASE_URL. A DB spec run outside the db project (an IDE runner, another
  // config) would reach the dev database, so the connection itself is checked.
  const {
    rows: [{ name }],
  } = await db.execute<{ name: string }>(sql`select current_database() as name`)

  if (!name.endsWith('_test')) {
    throw new Error(
      `Refusing to truncate "${name}": DB specs only run against a database ending in "_test". Run them with \`npm run test:db\`.`
    )
  }

  const { rows } = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`
  )

  if (rows.length === 0) {
    return
  }

  const tables = rows
    .map((row) => `${pg.escapeIdentifier('public')}.${pg.escapeIdentifier(row.tablename)}`)
    .join(', ')
  await db.execute(sql.raw(`truncate table ${tables} restart identity cascade`))
}
