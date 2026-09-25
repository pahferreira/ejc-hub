import { describe, it, expect } from 'vitest'
import { isUniqueViolation } from './is-unique-violation.ts'

function pgError(code: string, constraint?: string) {
  return Object.assign(new Error('duplicate key value violates unique constraint'), {
    code,
    constraint,
  })
}

describe('isUniqueViolation', () => {
  it('recognises a Postgres 23505 error', () => {
    expect(isUniqueViolation(pgError('23505'))).toBe(true)
  })

  it('rejects any other Postgres error code', () => {
    // 23503 is foreign_key_violation: also a constraint, also not this one.
    expect(isUniqueViolation(pgError('23503'))).toBe(false)
  })

  it('matches when the named constraint is the one that failed', () => {
    const error = pgError('23505', 'team_memberships_event_id_user_id_unique')

    expect(isUniqueViolation(error, 'team_memberships_event_id_user_id_unique')).toBe(true)
  })

  it('does not report a different constraint as the one asked about', () => {
    // A transaction touching several unique indexes must not report someone
    // else's clash as "already assigned to a team".
    const error = pgError('23505', 'member_requests_open_team_user_idx')

    expect(isUniqueViolation(error, 'team_memberships_event_id_user_id_unique')).toBe(false)
  })

  it('finds the driver error Drizzle wrapped in a DrizzleQueryError', () => {
    const wrapped = Object.assign(new Error('Failed query'), {
      cause: pgError('23505', 'team_memberships_event_id_user_id_unique'),
    })

    expect(isUniqueViolation(wrapped, 'team_memberships_event_id_user_id_unique')).toBe(true)
  })

  it('stops rather than spinning on a cyclic cause chain', () => {
    const first = new Error('first') as Error & { cause?: unknown }
    const second = new Error('second') as Error & { cause?: unknown }
    first.cause = second
    second.cause = first

    expect(isUniqueViolation(first)).toBe(false)
  })

  it('treats a non-error value as not a unique violation', () => {
    expect(isUniqueViolation(undefined)).toBe(false)
    expect(isUniqueViolation(null)).toBe(false)
    expect(isUniqueViolation('23505')).toBe(false)
  })
})
