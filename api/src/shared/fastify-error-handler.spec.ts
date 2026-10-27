import { describe, it, expect, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { Writable } from 'node:stream'
import { fastifyErrorHandler } from './fastify-error-handler.ts'
import { AppError, AppErrorCode } from './AppError.ts'

type LogLine = { level: number; msg: string; err?: { message: string } }

const PINO_ERROR_LEVEL = 50

// Mirrors how every route uses the handler: the error is caught and handed
// over, and the handler's return value is not passed back to Fastify.
const buildServer = (error: unknown) => {
  const logs: LogLine[] = []
  const stream = new Writable({
    write: (chunk: Buffer, _encoding, callback) => {
      logs.push(JSON.parse(chunk.toString()) as LogLine)
      callback()
    },
  })
  const server = Fastify({ logger: { level: 'info', stream } })

  server.get('/boom', async (_request, reply) => {
    try {
      throw error
    } catch (caught) {
      fastifyErrorHandler(reply, caught)
    }
  })

  return { server, logs }
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

    const response = await server.inject({ method: 'GET', url: '/boom' })

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

    await server.inject({ method: 'GET', url: '/boom' })

    const errorLogs = built.logs.filter((line) => line.level === PINO_ERROR_LEVEL)
    expect(errorLogs).toHaveLength(1)
    expect(errorLogs[0].err?.message).toBe('connection to db-internal:5432 refused')
  })

  it('answers a non-Error throw with the same generic 500', async () => {
    const built = buildServer('something odd was thrown')
    server = built.server

    const response = await server.inject({ method: 'GET', url: '/boom' })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      message: 'Internal server error',
      code: AppErrorCode.InternalError,
    })
  })

  it('answers a forbidden AppError with a 403 and its message', async () => {
    const built = buildServer(new AppError('Not your team', AppErrorCode.Forbidden))
    server = built.server

    const response = await server.inject({ method: 'GET', url: '/boom' })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ message: 'Not your team', code: AppErrorCode.Forbidden })
  })

  it('answers a not-found AppError with a 404 and its message', async () => {
    const built = buildServer(new AppError('Meeting not found', AppErrorCode.NotFound))
    server = built.server

    const response = await server.inject({ method: 'GET', url: '/boom' })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: 'Meeting not found', code: AppErrorCode.NotFound })
  })

  it('answers any other AppError with a 422 and its message', async () => {
    const built = buildServer(
      new AppError('Subscriptions are closed', AppErrorCode.SubscriptionsClosed)
    )
    server = built.server

    const response = await server.inject({ method: 'GET', url: '/boom' })

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

    await server.inject({ method: 'GET', url: '/boom' })

    expect(built.logs.filter((line) => line.level === PINO_ERROR_LEVEL)).toHaveLength(0)
  })
})
