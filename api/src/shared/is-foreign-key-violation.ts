import { isPostgresViolation } from './is-unique-violation.ts'

/**
 * Postgres' `foreign_key_violation`.
 *
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const FOREIGN_KEY_VIOLATION = '23503'

/**
 * Whether an error is a Postgres foreign-key violation, optionally of one named
 * constraint: the row it points at was deleted between the read and the write.
 */
export function isForeignKeyViolation(error: unknown, constraint?: string): boolean {
  return isPostgresViolation(error, FOREIGN_KEY_VIOLATION, constraint)
}
