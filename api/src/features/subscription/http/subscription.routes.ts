import { z } from 'zod/v4'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { subscriptionApp } from '../application/subscription.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { SubscriptionPermissions } from '../../../../../common/permissions/permissions.types.ts'

const subscriptionIdParamSchema = z.object({
  subscriptionId: z.string(),
})

export function subscriptionRoutes(server: FastifyServerInstance) {
  return () => {
    server.get(
      '/subscriptions',
      {
        preHandler: authGuard(server, { permissions: [SubscriptionPermissions.Read] }),
      },
      async (_, reply) => {
        try {
          const subscriptions = await subscriptionApp.listSubscriptions()

          return reply.code(HttpStatus.Ok).send({ subscriptions })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
    server.get(
      '/subscriptions/:subscriptionId',
      {
        schema: { params: subscriptionIdParamSchema },

        preHandler: authGuard(server, { permissions: [SubscriptionPermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { subscriptionId } = request.params
          const subscription = await subscriptionApp.getSubscription(subscriptionId)

          return reply.code(HttpStatus.Ok).send({ subscription })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
