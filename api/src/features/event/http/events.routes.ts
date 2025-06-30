import { z } from 'zod/v4'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { eventsApp } from '../application/Events.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'

const eventIdParamSchema = z.object({
  eventId: z.uuid(),
})

const createEventBodySchema = z.object({
  name: z.string().nonempty(),
  description: z.string().nonempty(),
})

const updateEventBodySchema = createEventBodySchema.partial()

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
  }
}
