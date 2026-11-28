import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { assertIsTestDatabase, TEST_DATABASE_URL } from './test-database-url.ts'

const MIGRATIONS_FOLDER = fileURLToPath(new URL('../migrations', import.meta.url))

// Runs once before the DB specs: refuses a non-test database, fails loudly when
// the test database is down (a skipped DB spec would read as a passing one), and
// brings the schema up to date with the project's migrations.
export default async function setup() {
  assertIsTestDatabase(TEST_DATABASE_URL)

  const pool = new pg.Pool({ connectionString: TEST_DATABASE_URL })
  const db = drizzle(pool, { casing: 'snake_case' })

  try {
    await pool.query('select 1')
  } catch (error) {
    await pool.end()
    throw new Error(
      [
        `DB specs could not reach the test database at ${redact(TEST_DATABASE_URL)}.`,
        'Start it with `docker compose up -d db` in api/, or set TEST_DATABASE_URL.',
        'To run only the specs that need no database: `npm run test:unit`.',
      ].join('\n'),
      { cause: error }
    )
  }

  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
  } finally {
    await pool.end()
  }
}

function redact(url: string) {
  const parsed = new URL(url)
  parsed.password = parsed.password ? '***' : ''
  return parsed.toString()
}
