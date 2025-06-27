import { z } from 'zod/v4'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { eventsApp } from '../application/Events.ts'

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
      const events = await eventsApp.listEvents()

      return reply.code(HttpStatus.Ok).send({
        events,
      })
    })

    server.get(
      '/events/:eventId',
      {
        schema: {
          params: eventIdParamSchema,
        },
      },
      async (request, reply) => {
        const { eventId } = request.params
        const event = await eventsApp.getEvent(eventId)

        if (!event) {
          return reply.code(HttpStatus.NotFound)
        }

        return reply.code(HttpStatus.Ok).send(event)
      }
    )

    server.post('/events', { schema: { body: createEventBodySchema } }, async (request, reply) => {
      const event = await eventsApp.createEvent(request.body)

      return reply.code(HttpStatus.Ok).header('location', `/events/${event.id}`).send({ event })
    })

    server.patch(
      '/events/:eventId',
      { schema: { params: eventIdParamSchema, body: updateEventBodySchema } },
      async (request, reply) => {
        const { eventId } = request.params
        const event = await eventsApp.updateEvent(eventId, request.body)

        return reply.code(HttpStatus.Ok).send({ event })
      }
    )

    server.delete(
      '/events/:eventId',
      { schema: { params: eventIdParamSchema } },
      async (request, reply) => {
        const { eventId } = request.params
        const event = await eventsApp.deleteEvent(eventId)

        return reply.code(HttpStatus.Ok).send({ message: `${event.name} deleted successfuly.` })
      }
    )
  }
}
