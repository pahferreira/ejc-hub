import { z } from 'zod/v4'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { eventsApp } from '../application/events-app.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { fastifyRequireAuth } from '../../../shared/fastify-require-auth.ts'
import { extractUserInformationFromToken } from '../../../shared/extract-user-info-from-token.ts'

const eventIdParamSchema = z.object({
  eventId: z.uuid(),
})

const subscriptionIdParamSchema = z.object({
  ...eventIdParamSchema.shape,
  subscriptionId: z.uuid(),
})

const subscriptionAvailabilityEnum = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

const subscribeBodySchema = z.object({
  user: z.object({
    emergencyContactName: z.string('emergency contact name is required').nonempty(),
    emergencyContactPhone: z.string('emergency contact phone is required').nonempty(),
    isNewbie: z.boolean().optional(),
    hasCoordinatorExperience: z.boolean().optional(),
  }),
  skills: z.object({
    hasActingSkills: z.boolean().optional(),
    hasCommunicationSkills: z.boolean().optional(),
    hasCookingSkills: z.boolean().optional(),
    hasDancingSkills: z.boolean().optional(),
    hasManualSkills: z.boolean().optional(),
    hasMusicSkills: z.boolean().optional(),
    hasSingingSkills: z.boolean().optional(),
  }),
  options: z.array(z.string()).length(3, 'Exactly 3 options are required'),
  availability: z
    .array(subscriptionAvailabilityEnum)
    .min(1, 'At least one availability day is required'),
})

const teamKeysQuerystringSchema = z.object({
  teamKeys: z.preprocess((value) => {
    if (typeof value === 'string') {
      return value.split(',')
    }
  }, z.array(z.string()).optional()),
})

const paginationQuerystringSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  size: z.coerce.number().int().min(1).optional(),
})

const listSubscriptionsQuerystringSchema = z.object({
  name: z.string().optional(),
  ...teamKeysQuerystringSchema.shape,
  ...paginationQuerystringSchema.shape,
})

export function eventsRoutes(server: FastifyServerInstance) {
  return () => {
    server.post(
      '/events/:eventId/subscribe',
      {
        schema: { params: eventIdParamSchema, body: subscribeBodySchema },
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        preHandler: fastifyRequireAuth(server),
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
      { schema: { params: eventIdParamSchema, querystring: listSubscriptionsQuerystringSchema } },
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

    server.get('/events/current', async (_, reply) => {
      try {
        const currentEvent = await eventsApp.getCurrentEvent()

        return reply.code(HttpStatus.Ok).send({ currentEvent })
      } catch (error) {
        fastifyErrorHandler(reply, error)
      }
    })

    server.post(
      '/events/:eventId/subscriptions/:subscriptionId/receive',
      { schema: { params: subscriptionIdParamSchema } },
      async (request, reply) => {
        try {
          const { subscriptionId } = request.params
          const subscription = await eventsApp.receiveSubscription(subscriptionId)

          return reply.code(HttpStatus.Ok).send({
            subscription,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/events/:eventId/subscriptions/:subscriptionId/wait-list',
      { schema: { params: subscriptionIdParamSchema } },
      async (request, reply) => {
        try {
          const { subscriptionId } = request.params
          const subscription = await eventsApp.onHoldSubscription(subscriptionId)

          return reply.code(HttpStatus.Ok).send({
            subscription,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
