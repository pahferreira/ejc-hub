import type { Observability } from './domain/Observability.ts'
import { NoopObservability } from './adapters/NoopObservability.ts'
import { PostHogObservability } from './adapters/PostHogObservability.ts'

type ObservabilityConfig = {
  apiKey?: string
  host: string
}

/** PostHog when a key is configured, otherwise a no-op. */
export function createObservability({ apiKey, host }: ObservabilityConfig): Observability {
  if (!apiKey) {
    return new NoopObservability()
  }

  return new PostHogObservability({ apiKey, host })
}
