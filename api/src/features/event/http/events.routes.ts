import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { eventsApp } from '../application/events-app.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { extractUserInformationFromToken } from '../../../shared/extract-user-info-from-token.ts'
import {
  SubscriptionPermissions,
  TeamInstancePermissions,
} from '../../../../../common/permissions/permissions.types.ts'
import {
  eventIdParamSchema,
  listCurrentSubscriptionsQuerystringSchema,
  listCurrentTeamsQuerystringSchema,
  listSubscriptionsQuerystringSchema,
  subscribeBodySchema,
  subscribeCurrentSchema,
  teamKeysQuerystringSchema,
} from './events.schema.ts'

export function eventsRoutes(server: FastifyServerInstance) {
  return () => {
    server.post(
      '/events/:eventId/subscribe',
      {
        schema: { params: eventIdParamSchema, body: subscribeBodySchema },

        preHandler: authGuard(server, { permissions: [SubscriptionPermissions.Create] }),
      },
      async (request, reply) => {
        try {
          const token = request.getToken()
          if (token) {
            const { authId } = extractUserInformationFromToken(token)
            const { eventId } = request.params
            const subscription = await eventsApp.subscribe(eventId, authId, request.body)

            return reply.code(HttpStatus.Ok).send({ subscription })
          }
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/events/:eventId/teams',
      {
        schema: { params: eventIdParamSchema, querystring: teamKeysQuerystringSchema },

        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const { teamKeys } = request.query
          const teams = await eventsApp.listTeams(eventId, teamKeys)

          return reply.code(HttpStatus.Ok).send({ teams })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/events/:eventId/subscriptions',
      {
        schema: { params: eventIdParamSchema, querystring: listSubscriptionsQuerystringSchema },

        preHandler: authGuard(server, { permissions: [SubscriptionPermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const { teamKeys, name, page, size } = request.query
          const filtering = { teamKeys, name }
          const pagination = { page, size }

          const subscriptions = await eventsApp.listSubscriptions(eventId, filtering, pagination)

          return reply.code(HttpStatus.Ok).send({ subscriptions })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/events/current',
      {
        preHandler: authGuard(server),
      },
      async (_, reply) => {
        try {
          const currentEvent = await eventsApp.getCurrentEvent()

          return reply.code(HttpStatus.Ok).send({ currentEvent })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/events/current/subscriptions',
      {
        schema: { querystring: listCurrentSubscriptionsQuerystringSchema },
        preHandler: authGuard(server, { permissions: [SubscriptionPermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { teamKeys, name, status, page, pageSize } = request.query
          const result = await eventsApp.listCurrentEventSubscriptions(
            { teamKeys, name, status },
            { page, pageSize }
          )

          return reply.code(HttpStatus.Ok).send(result)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/events/current/subscriptions/stats',
      {
        preHandler: authGuard(server, { permissions: [SubscriptionPermissions.Read] }),
      },
      async (_, reply) => {
        try {
          const stats = await eventsApp.getCurrentEventSubscriptionStats()

          return reply.code(HttpStatus.Ok).send(stats)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/events/current/teams',
      {
        schema: { querystring: listCurrentTeamsQuerystringSchema },
        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { name, status } = request.query
          const teams = await eventsApp.getCurrentEventTeams({ name, status })

          return reply.code(HttpStatus.Ok).send({ teams })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/events/current/teams/overview',
      {
        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Read] }),
      },
      async (_, reply) => {
        try {
          const result = await eventsApp.getCurrentEventTeamsOverview()

          return reply.code(HttpStatus.Ok).send(result)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/events/current',
      {
        preHandler: authGuard(server),
        schema: { body: subscribeCurrentSchema },
      },
      async (request, reply) => {
        try {
          const token = request.getToken()
          if (token) {
            const { authId } = extractUserInformationFromToken(token)
            const subscription = await eventsApp.subscribeCurrentEvent(authId, request.body)

            return reply.code(HttpStatus.Ok).send({ subscription })
          }
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/events/current/subscription/me',
      {
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          const token = request.getToken()
          if (token) {
            const { authId } = extractUserInformationFromToken(token)
            const result = await eventsApp.getCurrentEventSubscriptionStatus(authId)

            return reply.code(HttpStatus.Ok).send(result)
          }
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
