import { describe, it, expect, afterEach, vi } from 'vitest'
import Fastify, {
  type FastifyInstance,
  type FastifyRequest,
  type preHandlerHookHandler,
} from 'fastify'
import type { FastifyOtelRequestContext } from '@fastify/otel'
import { registerObservability, bindRequestLogger } from './fastify-observability.ts'
import { NoopObservability } from '../core/observability/adapters/NoopObservability.ts'

const AUTH_SUB = 'auth0|abc123'

const fakeAuth: preHandlerHookHandler = (request, _reply, done) => {
  request.user = { sub: AUTH_SUB }
  done()
}

// `@fastify/otel` decorates every request with `opentelemetry()` once the SDK
// has started. The fake stands in for it, recording what lands on the span.
const buildServer = ({ traced }: { traced: boolean }) => {
  const server = Fastify()
  const span = { setAttributes: vi.fn() }

  if (traced) {
    server.decorateRequest(
      'opentelemetry',
      () => ({ enabled: true, span }) as unknown as FastifyOtelRequestContext
    )
  }

  registerObservability(server, new NoopObservability())

  server.get('/private', { preHandler: fakeAuth }, () => ({ ok: true }))
  server.get('/public', () => ({ ok: true }))

  return { server, span }
}

describe('registerObservability span identity', () => {
  let server: FastifyInstance | undefined

  afterEach(async () => {
    await server?.close()
    server = undefined
  })

  it('tags the request span with the verified person and their session', async () => {
    const built = buildServer({ traced: true })
    server = built.server

    await server.inject({
      method: 'GET',
      url: '/private',
      headers: { 'x-posthog-session-id': 'session-7' },
    })

    expect(built.span.setAttributes).toHaveBeenCalledWith({
      posthogDistinctId: AUTH_SUB,
      sessionId: 'session-7',
    })
  })

  it('ignores the client-sent distinct ID header, which is not identity', async () => {
    const built = buildServer({ traced: true })
    server = built.server

    await server.inject({
      method: 'GET',
      url: '/public',
      headers: { 'x-posthog-distinct-id': 'someone-else', 'x-posthog-session-id': 'session-7' },
    })

    expect(built.span.setAttributes).toHaveBeenCalledWith({ sessionId: 'session-7' })
  })

  it('leaves an anonymous request without a session untagged', async () => {
    const built = buildServer({ traced: true })
    server = built.server

    await server.inject({ method: 'GET', url: '/public' })

    expect(built.span.setAttributes).not.toHaveBeenCalled()
  })

  it('answers normally when tracing is off', async () => {
    const built = buildServer({ traced: false })
    server = built.server

    const response = await server.inject({ method: 'GET', url: '/private' })

    expect(response.statusCode).toBe(200)
  })
})

describe('bindRequestLogger', () => {
  const buildRequest = (overrides: Partial<FastifyRequest>) => {
    const child = vi.fn((bindings: Record<string, unknown>) => ({ name: 'child', bindings }))
    const request = {
      id: 'req-1',
      headers: {},
      log: { child },
      ...overrides,
    } as unknown as FastifyRequest

    return { request, child }
  }

  it('binds the person, their session and the request id onto the logger', () => {
    const { request, child } = buildRequest({
      user: { sub: AUTH_SUB },
      headers: { 'x-posthog-session-id': 'session-7' },
    })

    bindRequestLogger(request)

    expect(child).toHaveBeenCalledWith({
      requestId: 'req-1',
      posthogDistinctId: AUTH_SUB,
      sessionId: 'session-7',
    })
    expect(request.log).toMatchObject({ name: 'child' })
  })

  it('does not set the internal user_id, which is only known later', () => {
    const { request, child } = buildRequest({ user: { sub: AUTH_SUB } })

    bindRequestLogger(request)

    expect(child.mock.calls[0][0]).not.toHaveProperty('user_id')
  })

  it('leaves the logger untouched when there is nothing to link', () => {
    const { request, child } = buildRequest({})

    bindRequestLogger(request)

    expect(child).not.toHaveBeenCalled()
  })
})
