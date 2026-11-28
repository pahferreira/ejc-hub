import { describe, it, expect, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'
import type { Database } from '../client.ts'
import { resetDatabase } from './reset-database.ts'

const dialect = new PgDialect()

function fakeDb(databaseName: string, tables: string[]) {
  const execute = vi
    .fn()
    .mockResolvedValueOnce({ rows: [{ name: databaseName }] })
    .mockResolvedValueOnce({ rows: tables.map((tablename) => ({ tablename })) })
    .mockResolvedValue({ rows: [] })

  return { db: { execute } as unknown as Database, execute }
}

const renderedQueries = (execute: ReturnType<typeof vi.fn>) =>
  execute.mock.calls.map(([query]) => dialect.sqlToQuery(query as SQL).sql)

describe('resetDatabase', () => {
  it('refuses to truncate a connection whose database does not end in _test', async () => {
    const { db, execute } = fakeDb('ejc_hub', ['users'])

    await expect(resetDatabase(db)).rejects.toThrow('Refusing to truncate "ejc_hub"')
    expect(renderedQueries(execute)).toEqual(['select current_database() as name'])
  })

  it('truncates every public table, quoted, on a _test database', async () => {
    const { db, execute } = fakeDb('ejc_hub_test', ['users', 'odd"name'])

    await resetDatabase(db)

    expect(renderedQueries(execute).at(-1)).toBe(
      'truncate table "public"."users", "public"."odd""name" restart identity cascade'
    )
  })
})
