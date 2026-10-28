import { describe, it, expect } from 'vitest'
import { DrizzleQueryError } from 'drizzle-orm/errors'
import { scrubError } from './scrub-error.ts'

const buildQueryError = () => {
  const pgError = Object.assign(
    new Error('invalid input syntax for type uuid: "maria@example.com"'),
    { code: '22P02' }
  )

  return new DrizzleQueryError(
    'select "id" from "users" where "email" = $1 and "phone" = $2',
    ['maria@example.com', '+5511999999999'],
    pgError
  )
}

const scrubbedQueryError = () =>
  scrubError(buildQueryError()) as Error & { cause?: Error & { code?: string } }

describe('scrubError', () => {
  it('passes any other error through untouched', () => {
    const error = new Error('boom')

    expect(scrubError(error)).toBe(error)
  })

  describe('when a database query fails', () => {
    it('keeps the SQL with its placeholders, so the failing query can still be found', () => {
      expect(scrubbedQueryError().message).toBe(
        'Failed query: select "id" from "users" where "email" = $1 and "phone" = $2'
      )
    })

    it('drops the bound parameter values from the message, stack and cause', () => {
      const scrubbed = scrubbedQueryError()

      const everything = [
        scrubbed.message,
        scrubbed.stack,
        scrubbed.cause?.message,
        scrubbed.cause?.stack,
      ].join('\n')
      expect(everything).not.toContain('maria@example.com')
      expect(everything).not.toContain('+5511999999999')
    })

    it('keeps the Postgres error code of the cause', () => {
      expect(scrubbedQueryError().cause?.code).toBe('22P02')
    })

    it('keeps the stack frames that point at the failing code', () => {
      expect(scrubbedQueryError().stack).toMatch(/\n\s+at /)
    })
  })
})
