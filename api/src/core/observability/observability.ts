import { PostHog } from 'posthog-node'

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
      client.captureException(error, distinctId, {
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
