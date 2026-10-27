import type { FastifyReply } from 'fastify'
import { AppError, AppErrorCode } from './AppError.ts'
import { HttpStatus } from './http-statuses.ts'

export function fastifyErrorHandler(reply: FastifyReply, error: unknown) {
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

    return reply.code(HttpStatus.UnprocessableEntity).send({
      message: error.getMessage(),
      code: error.getAppErrorCode(),
    })
  }

  // Anything else is a bug, not a business rule. Log the real error through
  // Fastify's logger (tied to the request id) and keep its details off the
  // wire.
  reply.log.error({ err: error }, 'Unhandled error in route handler')
  return reply.code(HttpStatus.InternalServerError).send({
    message: 'Internal server error',
    code: AppErrorCode.InternalError,
  })
}
