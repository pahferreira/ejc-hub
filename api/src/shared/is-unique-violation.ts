/**
 * Postgres' `unique_violation`. The one error code this codebase reads.
 *
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const UNIQUE_VIOLATION = '23505'

/**
 * How deep to follow `cause` before giving up.
 *
 * Drizzle wraps a driver error in a `DrizzleQueryError` whose `cause` is the
 * original `pg` error, so the code we want is one level down — but the depth is
 * the driver's business, not ours, and a cyclic `cause` would otherwise spin
 * forever.
 */
const MAX_CAUSE_DEPTH = 5

type PostgresError = {
  code?: unknown
  constraint?: unknown
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Whether an error is a Postgres unique-constraint violation, optionally of one
 * named constraint.
 *
 * This exists because a constraint is the only check a concurrent transaction
 * cannot slip between. Approving a member request reads nothing to decide
 * whether the person is already placed — it inserts, and lets
 * `team_memberships_event_id_user_id_unique` answer. Turning that rejection
 * into a domain error is what this function is for; without it the caller can
 * only re-throw a driver error and lose the ability to say *why*.
 *
 * The constraint name is optional and, when given, is checked: a transaction
 * that touches several unique indexes must not report someone else's clash as
 * "already assigned to a team".
 *
 * Walks the `cause` chain because Drizzle wraps driver errors
 * (`DrizzleQueryError`), and reads the fields defensively — `pg`'s error shape
 * is not something the type system knows about at the catch site, which is
 * always `unknown`.
 */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  let current: unknown = error

  for (let depth = 0; depth <= MAX_CAUSE_DEPTH; depth += 1) {
    if (!isObject(current)) {
      return false
    }

    const candidate = current as PostgresError

    if (candidate.code === UNIQUE_VIOLATION) {
      // No constraint asked for means any unique violation counts.
      return constraint === undefined || candidate.constraint === constraint
    }

    current = (current as { cause?: unknown }).cause
  }

  return false
}
