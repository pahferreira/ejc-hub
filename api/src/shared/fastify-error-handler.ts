import type { FastifyReply } from 'fastify'
import { AppError } from './AppError.ts'
import { HttpStatus } from './http-statuses.ts'

export function fastifyErrorHandler(reply: FastifyReply, error: unknown) {
  console.log('###shared/fastify-error-handler.ts line:6 error###', error)
  if (error instanceof AppError) {
    return reply.code(HttpStatus.UnprocessableEntity).send({
      message: error.getMessage(),
    })
  }
  return reply.code(HttpStatus.InternalServerError)
}
