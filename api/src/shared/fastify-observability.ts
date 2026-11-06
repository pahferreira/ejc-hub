import type { FastifyError, FastifyInstance, FastifyRequest } from 'fastify'
import type { Observability } from '../core/observability/domain/Observability.ts'
// Type-only: brings in `@fastify/otel`'s `request.opentelemetry()` declaration.
import type {} from '@fastify/otel'
import { isHealthCheck, stopTracing } from '../core/observability/tracing.ts'
import { fastifyErrorHandler, requestContextFrom } from './fastify-error-handler.ts'
import { HttpStatus } from './http-statuses.ts'

declare module 'fastify' {
  interface FastifyInstance {
    observability: Observability
  }
}

/**
 * Makes `observability` reachable from every request, and closes the holes
 * the routes' own `try/catch` blocks leave.
 *
 * Call it on the root instance, before any route is registered, so the error
 * handler is inherited by every route plugin.
 */
export function registerObservability(server: FastifyInstance, observability: Observability) {
  server.decorate('observability', observability)

  // The safety net for errors that escape a route's `try/catch` (hooks,
  // serialization, a route that forgot to catch). Anything Fastify already
  // answers with a 4xx (validation, bad JSON) keeps its default response;
  // the rest goes through the shared handler, which captures it.
  server.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.statusCode !== undefined && error.statusCode < HttpStatus.InternalServerError) {
      throw error
    }

    return fastifyErrorHandler(request, reply, error)
  })

  // Links the trace to the person and their replay. `onSend` runs after the
  // route's `requireAuth`, so the verified `sub` is known by now. Without the
  // SDK (no PostHog key) `@fastify/otel` never decorates the request.
  server.addHook('onSend', (request, _reply, payload, done) => {
    tagRequestSpan(request)
    done(null, payload)
  })

  // Our own request logging, replacing Fastify's built-in pair (turned off with
  // `disableRequestLogging` in `server.ts`). The reason is the completed line:
  // Fastify logs it with the logger it captured at request start, before
  // `bindRequestLogger` runs, so it would miss the person and session. Logging
  // it here, through `request.log`, picks up the child bound after auth.
  // `/health` is skipped so the load balancer's probes stay out of the logs.
  server.addHook('onRequest', (request, _reply, done) => {
    if (!isHealthCheck(request.url)) {
      request.log.info({ req: request }, 'incoming request')
    }
    done()
  })

  server.addHook('onResponse', (request, reply, done) => {
    if (!isHealthCheck(request.url)) {
      request.log.info({ res: reply, responseTime: reply.elapsedTime }, 'request completed')
    }
    done()
  })

  // Flush buffered events and spans, so a deploy doesn't drop the last ones.
  server.addHook('onClose', async () => {
    await Promise.all([observability.shutdown(), stopTracing()])
  })
}

/**
 * Rebinds the request's Pino logger to a child carrying the person, their
 * replay and the request id. `instrumentation-pino` turns those bindings into
 * attributes on every OTel log record for the request, so logs around an error
 * link to the same person, session and request as its trace.
 *
 * Runs as a route `preHandler`, after `requireAuth`, so the verified `sub` is
 * known. Without a session or a verified person there is nothing to link, and
 * the logger is left untouched. The internal `user_id` is added later, where a
 * handler loads the user, with a further `request.log.child({ user_id })`.
 */
export function bindRequestLogger(request: FastifyRequest) {
  const { distinctId, sessionId, requestId } = requestContextFrom(request)

  if (!distinctId && !sessionId) {
    return
  }

  request.log = request.log.child({
    requestId,
    ...(distinctId && { posthogDistinctId: distinctId }),
    ...(sessionId && { sessionId }),
  })
}

function tagRequestSpan(request: FastifyRequest) {
  if (typeof request.opentelemetry !== 'function') {
    return
  }

  const { span } = request.opentelemetry()
  const { distinctId, sessionId } = requestContextFrom(request)

  if (!span || (!distinctId && !sessionId)) {
    return
  }

  span.setAttributes({
    ...(distinctId && { posthogDistinctId: distinctId }),
    ...(sessionId && { sessionId }),
  })
}
