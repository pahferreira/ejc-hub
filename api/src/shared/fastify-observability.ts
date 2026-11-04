import type { FastifyError, FastifyInstance, FastifyRequest } from 'fastify'
import type { Observability } from '../core/observability/domain/Observability.ts'
// Type-only: brings in `@fastify/otel`'s `request.opentelemetry()` declaration.
import type {} from '@fastify/otel'
import { stopTracing } from '../core/observability/tracing.ts'
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

  // Flush buffered events and spans, so a deploy doesn't drop the last ones.
  server.addHook('onClose', async () => {
    await Promise.all([observability.shutdown(), stopTracing()])
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
