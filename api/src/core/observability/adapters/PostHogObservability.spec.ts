import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DrizzleQueryError } from 'drizzle-orm/errors'
import { PostHog } from 'posthog-node'
import { PostHogObservability } from './PostHogObservability.ts'

// posthog-node is the boundary this adapter exists to wrap, so the test
// replaces it with a fake client that records calls instead of sending them.
const client = vi.hoisted(() => ({
  captureException: vi.fn<(error: unknown, ...rest: unknown[]) => void>(),
  shutdown: vi.fn(async () => {}),
}))

vi.mock('posthog-node', () => ({
  PostHog: vi.fn(() => client),
}))

const CONFIG = { apiKey: 'phc_test', host: 'https://eu.i.posthog.com' }

const PostHogMock = vi.mocked(PostHog)

describe('PostHogObservability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the PostHog client with the configured key and host', () => {
    new PostHogObservability(CONFIG)

    expect(PostHogMock).toHaveBeenCalledWith('phc_test', { host: 'https://eu.i.posthog.com' })
  })

  it('captures an error on the person, linked to the session, user and request', () => {
    const observability = new PostHogObservability(CONFIG)
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
    const observability = new PostHogObservability(CONFIG)
    const error = new Error('boom')

    observability.captureError(error, { requestId: 'req-1' })

    expect(client.captureException).toHaveBeenCalledWith(error, undefined, {
      request_id: 'req-1',
    })
  })

  it('scrubs a failed query before it is sent', () => {
    const observability = new PostHogObservability(CONFIG)

    observability.captureError(
      new DrizzleQueryError('select 1 where "email" = $1', ['maria@example.com']),
      { requestId: 'req-1' }
    )

    const [captured] = client.captureException.mock.calls[0]
    expect((captured as Error).message).toBe('Failed query: select 1 where "email" = $1')
  })

  it('flushes buffered events on shutdown', async () => {
    const observability = new PostHogObservability(CONFIG)

    await observability.shutdown()

    expect(client.shutdown).toHaveBeenCalledTimes(1)
  })
})
