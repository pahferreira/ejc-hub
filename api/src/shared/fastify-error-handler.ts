import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ErrorContext } from '../core/observability/domain/Observability.ts'
import { AppError, AppErrorCode } from './AppError.ts'
import { HttpStatus } from './http-statuses.ts'

/**
 * IDs only (ADR #7): never the body, the token itself, or anything personal.
 *
 * `distinctId` is the `sub` that `requireAuth` verified, so it is absent on
 * routes that fail before authentication. The `X-POSTHOG-DISTINCT-ID` header
 * is client-controlled and never used as identity; the session header is fine
 * because it only links the error to a replay.
 */
function errorContextFrom(request: FastifyRequest): ErrorContext {
  const sessionHeader = request.headers['x-posthog-session-id']
  const sessionId = typeof sessionHeader === 'string' ? sessionHeader : undefined

  return {
    ...(request.user?.sub && { distinctId: request.user.sub }),
    ...(sessionId && { sessionId }),
    requestId: request.id,
  }
}

export function fastifyErrorHandler(request: FastifyRequest, reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    // An authorization failure is a 403, not a 422: the request is well-formed,
    // the caller simply may not perform it.
    if (error.getAppErrorCode() === AppErrorCode.Forbidden) {
      return reply.code(HttpStatus.Forbidden).send({
        message: error.getMessage(),
        code: error.getAppErrorCode(),
      })
    }

    if (error.getAppErrorCode() === AppErrorCode.NotFound) {
      return reply.code(HttpStatus.NotFound).send({
        message: error.getMessage(),
        code: error.getAppErrorCode(),
      })
    }

    if (error.getAppErrorCode() === AppErrorCode.Validation) {
      return reply.code(HttpStatus.BadRequest).send({
        message: error.getMessage(),
        code: error.getAppErrorCode(),
      })
    }

    if (error.getAppErrorCode() === AppErrorCode.Conflict) {
      return reply.code(HttpStatus.Conflict).send({
        message: error.getMessage(),
        code: error.getAppErrorCode(),
      })
    }

    return reply.code(HttpStatus.UnprocessableEntity).send({
      message: error.getMessage(),
      code: error.getAppErrorCode(),
    })
  }

  // Anything else is a bug, not a business rule. Log the real error through
  // Fastify's logger (tied to the request id), send it to error tracking, and
  // keep its details off the wire.
  reply.log.error({ err: error }, 'Unhandled error in route handler')
  request.server.observability.captureError(error, errorContextFrom(request))
  return reply.code(HttpStatus.InternalServerError).send({
    message: 'Internal server error',
    code: AppErrorCode.InternalError,
  })
}
