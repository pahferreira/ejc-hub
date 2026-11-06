import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ErrorContext } from '../core/observability/domain/Observability.ts'
import { AppError, AppErrorCode } from './AppError.ts'
import { HttpStatus } from './http-statuses.ts'

/**
 * The IDs attached to errors and spans. IDs only (ADR #7): never the body,
 * the token itself, or anything personal.
 *
 * `distinctId` is the `sub` that `requireAuth` verified, so it is absent on
 * routes that fail before authentication. The `X-POSTHOG-DISTINCT-ID` header
 * is client-controlled and never used as identity; the session header is fine
 * because it only links the error or trace to a replay.
 */
export function requestContextFrom(request: FastifyRequest): ErrorContext {
  const sessionHeader = request.headers['x-posthog-session-id']
  const sessionId = typeof sessionHeader === 'string' ? sessionHeader : undefined

  return {
    ...(request.user?.sub && { distinctId: request.user.sub }),
    ...(sessionId && { sessionId }),
    requestId: request.id,
  }
}

/** The HTTP status a business rule maps to. The request is well-formed, so an
 * authorization failure is a 403 and a missing record a 404; the rest are a
 * 422. */
function appErrorStatus(code: ReturnType<AppError['getAppErrorCode']>) {
  if (code === AppErrorCode.Forbidden) {
    return HttpStatus.Forbidden
  }
  if (code === AppErrorCode.NotFound) {
    return HttpStatus.NotFound
  }
  return HttpStatus.UnprocessableEntity
}

export function fastifyErrorHandler(request: FastifyRequest, reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    const code = error.getAppErrorCode()

    // A handled business rejection, not a fault. The code (never the message,
    // which could one day quote personal data) rides on the reply, so the
    // single `request completed` line carries it. No separate log line.
    reply.appErrorCode = code

    return reply.code(appErrorStatus(code)).send({ message: error.getMessage(), code })
  }

  // Anything else is a bug, not a business rule. Log the real error through
  // Fastify's logger (tied to the request id), send it to error tracking, and
  // keep its details off the wire.
  reply.appErrorCode = AppErrorCode.InternalError
  reply.log.error({ err: error }, 'Unhandled error in route handler')
  request.server.observability.captureError(error, requestContextFrom(request))
  return reply.code(HttpStatus.InternalServerError).send({
    message: 'Internal server error',
    code: AppErrorCode.InternalError,
  })
}
