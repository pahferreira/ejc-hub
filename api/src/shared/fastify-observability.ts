import type { FastifyError, FastifyInstance } from 'fastify'
import type { Observability } from '../core/observability/observability.ts'
import { fastifyErrorHandler } from './fastify-error-handler.ts'
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

  // Flush buffered events, so a deploy doesn't drop the last errors.
  server.addHook('onClose', async () => {
    await observability.shutdown()
  })
}
