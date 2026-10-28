import { PostHog } from 'posthog-node'
import type { ErrorContext, Observability } from '../domain/Observability.ts'
import { scrubError } from '../scrub-error.ts'

// The only file that imports `posthog-node`.

export type PostHogObservabilityConfig = {
  apiKey: string
  host: string
}

export class PostHogObservability implements Observability {
  #client: PostHog

  constructor(config: PostHogObservabilityConfig) {
    this.#client = new PostHog(config.apiKey, { host: config.host })
  }

  captureError(error: unknown, { distinctId, userId, sessionId, requestId }: ErrorContext) {
    this.#client.captureException(scrubError(error), distinctId, {
      ...(sessionId && { $session_id: sessionId }),
      ...(userId && { user_id: userId }),
      request_id: requestId,
    })
  }

  async shutdown() {
    await this.#client.shutdown()
  }
}
