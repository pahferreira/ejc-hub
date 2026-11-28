import { describe, it, expect } from 'vitest'
import { isForeignKeyViolation } from './is-foreign-key-violation.ts'

function pgError(code: string, constraint?: string) {
  return Object.assign(new Error('violates foreign key constraint'), { code, constraint })
}

describe('isForeignKeyViolation', () => {
  it('recognises a Postgres 23503 error, through the cause Drizzle wraps it in', () => {
    const wrapped = Object.assign(new Error('Failed query'), { cause: pgError('23503') })

    expect(isForeignKeyViolation(wrapped)).toBe(true)
  })

  it('rejects a unique violation', () => {
    expect(isForeignKeyViolation(pgError('23505'))).toBe(false)
  })

  it('matches only the named constraint when one is given', () => {
    const error = pgError('23503', 'schedule_activity_notes_activity_id_schedule_activities_id_fk')

    expect(
      isForeignKeyViolation(error, 'schedule_activity_notes_activity_id_schedule_activities_id_fk')
    ).toBe(true)
    expect(isForeignKeyViolation(error, 'schedule_activity_notes_author_id_users_id_fk')).toBe(
      false
    )
  })
})
