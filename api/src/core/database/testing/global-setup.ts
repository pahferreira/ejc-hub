import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { assertIsTestDatabase, databaseName, TEST_DATABASE_URL } from './test-database-url.ts'

const MIGRATIONS_FOLDER = fileURLToPath(new URL('../migrations', import.meta.url))

// Runs once before the DB specs: refuses a non-test database, fails loudly when
// the test server is down (a skipped DB spec would read as a passing one),
// creates the database if it is missing and brings the schema up to date with
// the project's migrations.
export default async function setup() {
  assertIsTestDatabase(TEST_DATABASE_URL)
  await createDatabaseIfMissing(TEST_DATABASE_URL)

  const pool = new pg.Pool({ connectionString: TEST_DATABASE_URL })
  const db = drizzle(pool, { casing: 'snake_case' })

  try {
    await pool.query('select 1')
  } catch (error) {
    await pool.end()
    throw unreachable(TEST_DATABASE_URL, error)
  }

  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
  } finally {
    await pool.end()
  }
}

// Connects to the server's `postgres` database, since the test one may not
// exist yet. Two runs creating the same database at once: the loser gets
// `duplicate_database` (42P04) or a unique violation on pg_database (23505):
// either means it exists, so it is ignored.
async function createDatabaseIfMissing(url: string) {
  const maintenanceUrl = new URL(url)
  maintenanceUrl.pathname = '/postgres'
  const client = new pg.Client({ connectionString: maintenanceUrl.toString() })

  try {
    await client.connect()
  } catch (error) {
    throw unreachable(url, error)
  }

  try {
    const name = databaseName(url)
    const { rowCount } = await client.query('select 1 from pg_database where datname = $1', [name])

    if (rowCount === 0) {
      await client.query(`create database ${pg.escapeIdentifier(name)}`).catch((error) => {
        if (!['42P04', '23505'].includes((error as { code?: string }).code ?? '')) throw error
      })
    }
  } finally {
    await client.end()
  }
}

function unreachable(url: string, cause: unknown) {
  return new Error(
    [
      `DB specs could not reach the test database at ${redact(url)}.`,
      'Start it with `docker compose up -d db` in api/, or set TEST_DATABASE_URL.',
      'To run only the specs that need no database: `npm run test:unit`.',
    ].join('\n'),
    { cause }
  )
}

function redact(url: string) {
  const parsed = new URL(url)
  parsed.password = parsed.password ? '***' : ''
  return parsed.toString()
}
