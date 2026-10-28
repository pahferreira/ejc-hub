import { describe, it, expect, vi } from 'vitest'
import { DrizzleQueryError } from 'drizzle-orm/errors'
import { PostHogObservability, type ErrorTrackingClient } from './PostHogObservability.ts'

const CONFIG = { apiKey: 'phc_test', host: 'https://us.i.posthog.com' }

const buildFakeClient = () => ({
  captureException: vi.fn<ErrorTrackingClient['captureException']>(),
  shutdown: vi.fn<ErrorTrackingClient['shutdown']>(async () => {}),
})

describe('PostHogObservability', () => {
  it('captures an error on the person, linked to the session, user and request', () => {
    const client = buildFakeClient()
    const observability = new PostHogObservability(CONFIG, client)
    const error = new Error('boom')

    observability.captureError(error, {
      distinctId: 'auth0|abc',
      userId: 'user-42',
      sessionId: 'session-7',
      requestId: 'req-1',
    })

    expect(client.captureException).toHaveBeenCalledWith(error, 'auth0|abc', {
      $session_id: 'session-7',
      user_id: 'user-42',
      request_id: 'req-1',
    })
  })

  it('leaves the optional IDs out of the event when they are not known', () => {
    const client = buildFakeClient()
    const observability = new PostHogObservability(CONFIG, client)
    const error = new Error('boom')

    observability.captureError(error, { requestId: 'req-1' })

    expect(client.captureException).toHaveBeenCalledWith(error, undefined, {
      request_id: 'req-1',
    })
  })

  it('scrubs a failed query before it is sent', () => {
    const client = buildFakeClient()
    const observability = new PostHogObservability(CONFIG, client)

    observability.captureError(
      new DrizzleQueryError('select 1 where "email" = $1', ['maria@example.com']),
      { requestId: 'req-1' }
    )

    const [captured] = client.captureException.mock.calls[0]
    expect((captured as Error).message).toBe('Failed query: select 1 where "email" = $1')
  })

  it('flushes buffered events on shutdown', async () => {
    const client = buildFakeClient()
    const observability = new PostHogObservability(CONFIG, client)

    await observability.shutdown()

    expect(client.shutdown).toHaveBeenCalledTimes(1)
  })
})
