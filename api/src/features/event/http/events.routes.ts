import { z } from 'zod/v4'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { eventsApp } from '../application/events-app.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'

const eventIdParamSchema = z.object({
  eventId: z.uuid(),
})

const createEventBodySchema = z.object({
  name: z.string('required').nonempty(),
  description: z.string('required').nonempty(),
})

const updateEventBodySchema = createEventBodySchema.partial().refine((data) => {
  return data.name || data.description
}, 'At least one of the following attributes needs to be present: name, description')

const subscriptionAvailabilityEnum = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export const subscribeBodySchema = z.object({
  user: z.object({
    id: z.uuid(),
    emergencyContactName: z.string('emergency contact name is required').nonempty(),
    emergencyContactPhone: z.string('emergency contact phone is required').nonempty(),
    isNewbie: z.boolean(),
  }),
  skills: z.object({
    hasActingSkills: z.boolean().optional(),
    hasCoordinationSkills: z.boolean().optional(),
    hasLogisticsSkills: z.boolean().optional(),
    hasCommunicationSkills: z.boolean().optional(),
    hasManualSkills: z.boolean().optional(),
    hasCookingSkills: z.boolean().optional(),
    hasMusicSkills: z.boolean().optional(),
    hasDancingSkills: z.boolean().optional(),
    hasSingingSkills: z.boolean().optional(),
  }),
  hasCoordinatorExperience: z.boolean(),
  options: z.array(z.string()).length(3, 'Exactly 3 options are required'),
  availability: z
    .array(subscriptionAvailabilityEnum)
    .min(1, 'At least one availability day is required'),
})

export function eventsRoutes(server: FastifyServerInstance) {
  return () => {
    server.get('/events', {}, async (_, reply) => {
      try {
        const events = await eventsApp.listEvents()

        return reply.code(HttpStatus.Ok).send({
          events,
        })
      } catch (error) {
        fastifyErrorHandler(reply, error)
      }
    })

    server.get(
      '/events/:eventId',
      {
        schema: {
          params: eventIdParamSchema,
        },
      },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const event = await eventsApp.getEvent(eventId)

          return reply.code(HttpStatus.Ok).send(event)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post('/events', { schema: { body: createEventBodySchema } }, async (request, reply) => {
      try {
        const event = await eventsApp.createEvent(request.body)

        return reply.code(HttpStatus.Ok).header('location', `/events/${event.id}`).send({ event })
      } catch (error) {
        fastifyErrorHandler(reply, error)
      }
    })

    server.patch(
      '/events/:eventId',
      { schema: { params: eventIdParamSchema, body: updateEventBodySchema } },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const event = await eventsApp.updateEvent(eventId, request.body)

          return reply.code(HttpStatus.Ok).send({ event })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.delete(
      '/events/:eventId',
      { schema: { params: eventIdParamSchema } },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const event = await eventsApp.deleteEvent(eventId)

          return reply.code(HttpStatus.Ok).send({ message: `${event.name} deleted successfuly.` })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/events/:eventId/subscribe',
      { schema: { params: eventIdParamSchema, body: subscribeBodySchema } },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const subscription = await eventsApp.subscribe(eventId, request.body)

          return reply.code(HttpStatus.Ok).send({ subscription })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
