import type { Observability } from '../domain/Observability.ts'

// Local dev and tests run without a PostHog account.
export class NoopObservability implements Observability {
  captureError() {}

  async shutdown() {}
}
