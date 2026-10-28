import { DrizzleQueryError } from 'drizzle-orm/errors'

// The stack's frames, under a new first line. A V8 stack starts with
// `${name}: ${message}`, so the original message would otherwise ride along.
const withHeader = (header: string, stack: string | undefined) => {
  const frames = (stack ?? '').split('\n').filter((line) => /^\s+at /.test(line))

  return [header, ...frames].join('\n')
}

/**
 * Drops what the data policy forbids from an error before it leaves the API.
 *
 * Drizzle wraps every failed query in a `DrizzleQueryError` whose message ends
 * with the bound parameter values (emails, names, phones), and whose `cause`,
 * the Postgres error, can quote them too. Keep the SQL, which only holds
 * placeholders, the stack frames and the Postgres error code.
 */
export function scrubError(error: unknown): unknown {
  if (!(error instanceof DrizzleQueryError)) {
    return error
  }

  const safe = new Error(`Failed query: ${error.query}`)
  safe.name = 'DrizzleQueryError'
  safe.stack = withHeader(`${safe.name}: ${safe.message}`, error.stack)

  if (error.cause instanceof Error) {
    const rawCode = (error.cause as { code?: unknown }).code
    const code = typeof rawCode === 'string' ? rawCode : 'unknown'
    const cause = Object.assign(new Error(`Database error ${code}`), { code })
    cause.stack = withHeader(`Error: ${cause.message}`, error.cause.stack)
    safe.cause = cause
  }

  return safe
}
