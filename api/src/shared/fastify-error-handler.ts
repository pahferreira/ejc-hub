import type { FastifyReply } from 'fastify'
import { AppError, AppErrorCode } from './AppError.ts'
import { HttpStatus } from './http-statuses.ts'

export function fastifyErrorHandler(reply: FastifyReply, error: unknown) {
  console.log('###shared/fastify-error-handler.ts line:6 error###', error)
  if (error instanceof AppError) {
    // An authorization failure is a 403, not a 422: the request is well-formed,
    // the caller simply may not perform it.
    if (error.getAppErrorCode() === AppErrorCode.Forbidden) {
      return reply.code(HttpStatus.Forbidden).send({
        message: error.getMessage(),
        code: error.getAppErrorCode(),
      })
    }

    return reply.code(HttpStatus.UnprocessableEntity).send({
      message: error.getMessage(),
      code: error.getAppErrorCode(),
    })
  }
  return reply.code(HttpStatus.InternalServerError)
}
