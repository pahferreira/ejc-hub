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

/**
 * The status an `AppError` answers with, by code. Any code not listed is a
 * broken business rule and answers 422. An authorization failure is a 403, not
 * a 422: the request is well-formed, the caller simply may not perform it.
 */
const appErrorStatus: Partial<Record<string, number>> = {
  [AppErrorCode.Forbidden]: HttpStatus.Forbidden,
  [AppErrorCode.NotFound]: HttpStatus.NotFound,
  [AppErrorCode.Validation]: HttpStatus.BadRequest,
  [AppErrorCode.Conflict]: HttpStatus.Conflict,
}

export function fastifyErrorHandler(request: FastifyRequest, reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    const code = error.getAppErrorCode()

    return reply.code(appErrorStatus[code] ?? HttpStatus.UnprocessableEntity).send({
      message: error.getMessage(),
      code,
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
