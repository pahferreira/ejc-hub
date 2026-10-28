import { describe, it, expect } from 'vitest'
import { createObservability } from './observability.ts'
import type { Observability } from './domain/Observability.ts'
import { NoopObservability } from './adapters/NoopObservability.ts'
import { PostHogObservability } from './adapters/PostHogObservability.ts'

describe('createObservability', () => {
  it('is a no-op when the PostHog key is unset', () => {
    const observability = createObservability({ host: 'https://us.i.posthog.com' })

    expect(observability).toBeInstanceOf(NoopObservability)
  })

  it('treats an empty PostHog key as unset', () => {
    const observability = createObservability({ apiKey: '', host: 'https://us.i.posthog.com' })

    expect(observability).toBeInstanceOf(NoopObservability)
  })

  it('sends to PostHog when a key is configured', async () => {
    const observability = createObservability({
      apiKey: 'phc_test',
      host: 'https://us.i.posthog.com',
    })

    expect(observability).toBeInstanceOf(PostHogObservability)
    await observability.shutdown()
  })
})

describe('NoopObservability', () => {
  it('accepts captures and shutdown without doing anything', async () => {
    const observability: Observability = new NoopObservability()

    expect(() =>
      observability.captureError(new Error('boom'), { requestId: 'req-1' })
    ).not.toThrow()
    await expect(observability.shutdown()).resolves.toBeUndefined()
  })
})
