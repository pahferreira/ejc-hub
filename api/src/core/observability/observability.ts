import { PostHog } from 'posthog-node'
import { DrizzleQueryError } from 'drizzle-orm/errors'

// The only file that imports `posthog-node`. Everything else talks to the
// `Observability` interface, so tests can pass a fake and the vendor can change
// without touching routes.
//
// Data policy (ADR #7): only IDs leave the API. Never request or response
// bodies, names, emails or phone numbers.

export type ErrorContext = {
  // The verified JWT `sub`. Never the client-controlled `X-POSTHOG-DISTINCT-ID`
  // header, which is not identity.
  distinctId?: string
  // `users.id`, once the user has been looked up.
  userId?: string
  // The frontend PostHog session, from `X-POSTHOG-SESSION-ID`. For linking the
  // error to a replay only.
  sessionId?: string
  requestId: string
}

export type Observability = {
  captureError: (error: unknown, context: ErrorContext) => void
  shutdown: () => Promise<void>
}

export type ErrorTrackingClient = Pick<PostHog, 'captureException' | 'shutdown'>

type ObservabilityConfig = {
  apiKey?: string
  host: string
}

const createPostHogClient = (apiKey: string, host: string): ErrorTrackingClient =>
  new PostHog(apiKey, { host })

// The stack's frames, under a new first line. A V8 stack starts with
// `${name}: ${message}`, so the original message would otherwise ride along.
const withHeader = (header: string, stack: string | undefined) => {
  const frames = (stack ?? '').split('\n').filter((line) => /^\s+at /.test(line))

  return [header, ...frames].join('\n')
}

/**
 * Drizzle wraps every failed query in a `DrizzleQueryError` whose message ends
 * with the bound parameter values (emails, names, phones), and whose `cause`,
 * the Postgres error, can quote them too. Keep the SQL, which only holds
 * placeholders, the stack frames and the Postgres error code.
 */
function scrubbed(error: unknown): unknown {
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

const noopObservability: Observability = {
  captureError: () => {},
  shutdown: async () => {},
}

export function createObservability(
  config: ObservabilityConfig,
  createClient: (apiKey: string, host: string) => ErrorTrackingClient = createPostHogClient
): Observability {
  // Local dev and tests run without a PostHog account.
  if (!config.apiKey) {
    return noopObservability
  }

  const client = createClient(config.apiKey, config.host)

  return {
    captureError: (error, { distinctId, userId, sessionId, requestId }) => {
      client.captureException(scrubbed(error), distinctId, {
        ...(sessionId && { $session_id: sessionId }),
        ...(userId && { user_id: userId }),
        request_id: requestId,
      })
    },
    shutdown: async () => {
      await client.shutdown()
    },
  }
}
