import { describe, it, expect, afterEach, vi } from 'vitest'
import Fastify, { type FastifyInstance, type preHandlerHookHandler } from 'fastify'
import { Writable } from 'node:stream'
import { fastifyErrorHandler } from './fastify-error-handler.ts'
import { registerObservability } from './fastify-observability.ts'
import { AppError, AppErrorCode } from './AppError.ts'
import type { Observability } from '../core/observability/domain/Observability.ts'

type LogLine = { level: number; msg: string; err?: { message: string } }

const PINO_ERROR_LEVEL = 50

const AUTH_SUB = 'auth0|abc123'

const buildFakeObservability = () => ({
  captureError: vi.fn<Observability['captureError']>(),
  shutdown: vi.fn<Observability['shutdown']>(async () => {}),
})

// Mirrors how every route uses the handler: the error is caught and handed
// over, and the handler's return value is not passed back to Fastify. The
// preHandler stands in for `requireAuth`, which puts the verified claims on
// `request.user`.
const buildServer = (error: unknown) => {
  const logs: LogLine[] = []
  const stream = new Writable({
    write: (chunk: Buffer, _encoding, callback) => {
      logs.push(JSON.parse(chunk.toString()) as LogLine)
      callback()
    },
  })
  const server = Fastify({ logger: { level: 'info', stream } })
  const observability = buildFakeObservability()

  registerObservability(server, observability)

  const fakeAuth: preHandlerHookHandler = (request, _reply, done) => {
    request.user = { sub: AUTH_SUB }
    done()
  }

  server.post('/boom', { preHandler: fakeAuth }, (request, reply) => {
    try {
      throw error
    } catch (caught) {
      void fastifyErrorHandler(request, reply, caught)
    }
  })

  // A route that forgot its try/catch: only the safety net sees this error.
  server.get('/escape', { preHandler: fakeAuth }, () => {
    throw error
  })

  return { server, logs, observability }
}

describe('fastifyErrorHandler', () => {
  let server: FastifyInstance | undefined

  afterEach(async () => {
    await server?.close()
    server = undefined
  })

  it('answers an unexpected error with a 500 and a JSON body that hides its details', async () => {
    const built = buildServer(new Error('connection to db-internal:5432 refused'))
    server = built.server

    const response = await server.inject({ method: 'POST', url: '/boom' })

    expect(response.statusCode).toBe(500)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    expect(response.json()).toEqual({
      message: 'Internal server error',
      code: AppErrorCode.InternalError,
    })
    expect(response.body).not.toContain('db-internal')
  })

  it('logs an unexpected error through the Fastify logger at error level', async () => {
    const built = buildServer(new Error('connection to db-internal:5432 refused'))
    server = built.server

    await server.inject({ method: 'POST', url: '/boom' })

    const errorLogs = built.logs.filter((line) => line.level === PINO_ERROR_LEVEL)
    expect(errorLogs).toHaveLength(1)
    expect(errorLogs[0].err?.message).toBe('connection to db-internal:5432 refused')
  })

  it('captures an unexpected error on the token subject, with the request id and session', async () => {
    const error = new Error('connection to db-internal:5432 refused')
    const built = buildServer(error)
    server = built.server

    await server.inject({
      method: 'POST',
      url: '/boom',
      headers: { 'x-posthog-session-id': 'session-7' },
    })

    expect(built.observability.captureError).toHaveBeenCalledTimes(1)
    const [captured, context] = built.observability.captureError.mock.calls[0]
    expect(captured).toBe(error)
    expect(context).toMatchObject({ distinctId: AUTH_SUB, sessionId: 'session-7' })
  })

  it('captures the request id Fastify assigned to the failing request', async () => {
    const built = buildServer(new Error('boom'))
    server = built.server
    let requestId: string | undefined
    server.addHook('onRequest', (request, _reply, done) => {
      requestId = request.id
      done()
    })

    await server.inject({ method: 'POST', url: '/boom' })

    const [, context] = built.observability.captureError.mock.calls[0]
    expect(context.requestId).toBe(requestId)
  })

  it('never takes identity from the client-controlled distinct id header', async () => {
    const built = buildServer(new Error('boom'))
    server = built.server

    await server.inject({
      method: 'POST',
      url: '/boom',
      headers: { 'x-posthog-distinct-id': 'someone-else' },
    })

    const [, context] = built.observability.captureError.mock.calls[0]
    expect(context.distinctId).toBe(AUTH_SUB)
  })

  it('sends no request body or personal data with a captured error', async () => {
    const built = buildServer(new Error('boom'))
    server = built.server

    await server.inject({
      method: 'POST',
      url: '/boom',
      headers: { authorization: 'Bearer secret-token', 'x-posthog-session-id': 'session-7' },
      payload: { name: 'Maria Silva', email: 'maria@example.com', phone: '+5511999999999' },
    })

    const [, context] = built.observability.captureError.mock.calls[0]
    expect(Object.keys(context).sort()).toEqual(['distinctId', 'requestId', 'sessionId'])
    const serialized = JSON.stringify(context)
    expect(serialized).not.toContain('Maria')
    expect(serialized).not.toContain('maria@example.com')
    expect(serialized).not.toContain('+5511999999999')
    expect(serialized).not.toContain('secret-token')
  })

  it('answers a non-Error throw with the same generic 500', async () => {
    const built = buildServer('something odd was thrown')
    server = built.server

    const response = await server.inject({ method: 'POST', url: '/boom' })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      message: 'Internal server error',
      code: AppErrorCode.InternalError,
    })
  })

  it('answers a forbidden AppError with a 403 and its message', async () => {
    const built = buildServer(new AppError('Not your team', AppErrorCode.Forbidden))
    server = built.server

    const response = await server.inject({ method: 'POST', url: '/boom' })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ message: 'Not your team', code: AppErrorCode.Forbidden })
  })

  it('answers a not-found AppError with a 404 and its message', async () => {
    const built = buildServer(new AppError('Meeting not found', AppErrorCode.NotFound))
    server = built.server

    const response = await server.inject({ method: 'POST', url: '/boom' })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: 'Meeting not found', code: AppErrorCode.NotFound })
  })

  it('answers any other AppError with a 422 and its message', async () => {
    const built = buildServer(
      new AppError('Subscriptions are closed', AppErrorCode.SubscriptionsClosed)
    )
    server = built.server

    const response = await server.inject({ method: 'POST', url: '/boom' })

    expect(response.statusCode).toBe(422)
    expect(response.json()).toEqual({
      message: 'Subscriptions are closed',
      code: AppErrorCode.SubscriptionsClosed,
    })
  })

  it('does not log an expected AppError at error level', async () => {
    const built = buildServer(
      new AppError('Subscriptions are closed', AppErrorCode.SubscriptionsClosed)
    )
    server = built.server

    await server.inject({ method: 'POST', url: '/boom' })

    expect(built.logs.filter((line) => line.level === PINO_ERROR_LEVEL)).toHaveLength(0)
  })

  it.each([
    ['forbidden', new AppError('Not your team', AppErrorCode.Forbidden)],
    ['business rule', new AppError('Subscriptions are closed', AppErrorCode.SubscriptionsClosed)],
  ])('does not capture a %s AppError', async (_label, error) => {
    const built = buildServer(error)
    server = built.server

    await server.inject({ method: 'POST', url: '/boom' })

    expect(built.observability.captureError).not.toHaveBeenCalled()
  })
})

describe('registerObservability', () => {
  let server: FastifyInstance | undefined

  afterEach(async () => {
    await server?.close()
    server = undefined
  })

  it('captures an error that escapes the route try/catch and answers the generic 500', async () => {
    const error = new Error('thrown outside try/catch')
    const built = buildServer(error)
    server = built.server

    const response = await server.inject({ method: 'GET', url: '/escape' })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      message: 'Internal server error',
      code: AppErrorCode.InternalError,
    })
    expect(built.observability.captureError).toHaveBeenCalledTimes(1)
    const [captured, context] = built.observability.captureError.mock.calls[0]
    expect(captured).toBe(error)
    expect(context.distinctId).toBe(AUTH_SUB)
    expect(context.requestId).toEqual(expect.any(String))
  })

  it('leaves 4xx framework errors to Fastify and does not capture them', async () => {
    const error = Object.assign(new Error('Bad request'), { statusCode: 400 })
    const built = buildServer(error)
    server = built.server

    const response = await server.inject({ method: 'GET', url: '/escape' })

    expect(response.statusCode).toBe(400)
    expect(built.observability.captureError).not.toHaveBeenCalled()
  })

  it('flushes observability when the server closes', async () => {
    const built = buildServer(new Error('unused'))
    await built.server.ready()

    await built.server.close()

    expect(built.observability.shutdown).toHaveBeenCalledTimes(1)
  })
})
