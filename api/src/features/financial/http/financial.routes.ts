import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { financialApp } from '../application/financial.ts'
import { EventFeePermissions } from '../../../../../common/permissions/permissions.types.ts'

export function financialRoutes(server: FastifyServerInstance) {
  return () => {
    server.get(
      '/events/current/event-fee-overview',
      {
        preHandler: authGuard(server, { permissions: [EventFeePermissions.Read] }),
      },
      async (_, reply) => {
        try {
          const overview = await financialApp.getCurrentEventOverview()

          return reply.code(HttpStatus.Ok).send({ overview })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
