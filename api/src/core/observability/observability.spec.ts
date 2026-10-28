import { describe, it, expect, vi } from 'vitest'
import { DrizzleQueryError } from 'drizzle-orm/errors'
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

  describe('when a database query fails', () => {
    const buildQueryError = () => {
      const pgError = Object.assign(
        new Error('invalid input syntax for type uuid: "maria@example.com"'),
        { code: '22P02' }
      )

      return new DrizzleQueryError(
        'select "id" from "users" where "email" = $1 and "phone" = $2',
        ['maria@example.com', '+5511999999999'],
        pgError
      )
    }

    const captureQueryError = () => {
      const { client, createClient } = buildFakeClient()
      const observability = createObservability(
        { apiKey: 'phc_test', host: 'https://us.i.posthog.com' },
        createClient
      )

      observability.captureError(buildQueryError(), { requestId: 'req-1' })

      const [captured] = client.captureException.mock.calls[0]
      return captured as Error & { cause?: Error & { code?: string } }
    }

    it('sends the SQL with its placeholders, so the failing query can still be found', () => {
      const captured = captureQueryError()

      expect(captured.message).toBe(
        'Failed query: select "id" from "users" where "email" = $1 and "phone" = $2'
      )
    })

    it('never sends the bound parameter values, in the message, stack or cause', () => {
      const captured = captureQueryError()

      const everything = [
        captured.message,
        captured.stack,
        captured.cause?.message,
        captured.cause?.stack,
      ].join('\n')
      expect(everything).not.toContain('maria@example.com')
      expect(everything).not.toContain('+5511999999999')
    })

    it('keeps the Postgres error code of the cause', () => {
      const captured = captureQueryError()

      expect(captured.cause?.code).toBe('22P02')
    })

    it('keeps the stack frames that point at the failing code', () => {
      const captured = captureQueryError()

      expect(captured.stack).toMatch(/\n\s+at /)
    })
  })
})
