import { describe, it, expect, vi } from 'vitest'
import { createObservability, type ErrorTrackingClient } from './observability.ts'

const buildFakeClient = () => {
  const client = {
    captureException: vi.fn<ErrorTrackingClient['captureException']>(),
    shutdown: vi.fn<ErrorTrackingClient['shutdown']>(async () => {}),
  }
  const createClient = vi.fn(() => client)

  return { client, createClient }
}

describe('createObservability', () => {
  it('never creates a client and does nothing when the PostHog key is unset', async () => {
    const { createClient } = buildFakeClient()
    const observability = createObservability({ host: 'https://us.i.posthog.com' }, createClient)

    observability.captureError(new Error('boom'), { requestId: 'req-1', distinctId: 'auth0|abc' })
    await observability.shutdown()

    expect(createClient).not.toHaveBeenCalled()
  })

  it('creates the client with the configured key and host', () => {
    const { createClient } = buildFakeClient()

    createObservability({ apiKey: 'phc_test', host: 'https://eu.i.posthog.com' }, createClient)

    expect(createClient).toHaveBeenCalledWith('phc_test', 'https://eu.i.posthog.com')
  })

  it('captures an error on the person, linked to the session, user and request', () => {
    const { client, createClient } = buildFakeClient()
    const observability = createObservability(
      { apiKey: 'phc_test', host: 'https://us.i.posthog.com' },
      createClient
    )
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
    const { client, createClient } = buildFakeClient()
    const observability = createObservability(
      { apiKey: 'phc_test', host: 'https://us.i.posthog.com' },
      createClient
    )
    const error = new Error('boom')

    observability.captureError(error, { requestId: 'req-1' })

    expect(client.captureException).toHaveBeenCalledWith(error, undefined, {
      request_id: 'req-1',
    })
  })

  it('flushes buffered events on shutdown', async () => {
    const { client, createClient } = buildFakeClient()
    const observability = createObservability(
      { apiKey: 'phc_test', host: 'https://us.i.posthog.com' },
      createClient
    )

    await observability.shutdown()

    expect(client.shutdown).toHaveBeenCalledTimes(1)
  })
})
