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

/**
 * What the rest of the API sees of observability. Routes and hooks talk to
 * this interface only, so tests can pass a fake and the vendor can change
 * without touching them.
 */
export interface Observability {
  captureError: (error: unknown, context: ErrorContext) => void

  /** Flushes anything buffered. Called once, when the server closes. */
  shutdown: () => Promise<void>
}
