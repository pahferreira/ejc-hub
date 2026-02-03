import { z } from 'zod/v4'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { controlPanelApp } from '../application/control-panel.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import {
  EventPermissions,
  TeamTemplatePermissions,
} from '../../../../../common/permissions/permissions.types.ts'

export const teamTemplateIdParamSchema = z.object({
  teamTemplateId: z.uuid('required'),
})

export const postTeamTemplateBodySchema = z.object({
  name: z.string('Team template name is required').nonempty('Team template cannot be empty'),
  key: z.string('Team template key is required').nonempty('Team template key cannot be empty'),
  description: z.string().optional(),
})

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

export const patchTeamTemplateBodySchema = postTeamTemplateBodySchema.partial().refine((data) => {
  return data.name || data.description
}, 'At least one field (name or description) is required for update')

export function controlPanelRoutes(server: FastifyServerInstance) {
  return () => {
    // Team Management
    server.get(
      '/control-panel/team-templates',
      {
        preHandler: authGuard(server, { permissions: [TeamTemplatePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const teamTemplates = await controlPanelApp.listTeamTemplates()

          return reply.code(HttpStatus.Ok).send({
            teamTemplates,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/control-panel/team-templates/:teamTemplateId',
      {
        schema: { params: teamTemplateIdParamSchema },

        preHandler: authGuard(server, { permissions: [TeamTemplatePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { teamTemplateId } = request.params
          const teamTemplate = await controlPanelApp.getTeamTemplateById(teamTemplateId)

          return reply.code(HttpStatus.Ok).send({ teamTemplate })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/control-panel/team-templates',
      {
        schema: { body: postTeamTemplateBodySchema },

        preHandler: authGuard(server, { permissions: [TeamTemplatePermissions.Create] }),
      },
      async (request, reply) => {
        try {
          const { name, key, description } = request.body
          const result = await controlPanelApp.createTeamTemplate({ name, key, description })

          return reply
            .code(HttpStatus.Created)
            .header('location', `/control-panel/team-templates/${result.id}`)
            .send({ result })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.patch(
      '/control-panel/team-templates/:teamTemplateId',
      {
        schema: { body: patchTeamTemplateBodySchema, params: teamTemplateIdParamSchema },

        preHandler: authGuard(server, { permissions: [TeamTemplatePermissions.Update] }),
      },
      async (request, reply) => {
        try {
          const { teamTemplateId } = request.params
          const { name, description } = request.body
          const result = await controlPanelApp.updateTeamTemplate(teamTemplateId, {
            name,
            description,
          })

          return reply.code(HttpStatus.Ok).send({ result })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.delete(
      '/control-panel/team-templates/:teamTemplateId',
      {
        schema: { params: teamTemplateIdParamSchema },

        preHandler: authGuard(server, { permissions: [TeamTemplatePermissions.Delete] }),
      },
      async (request, reply) => {
        try {
          const { teamTemplateId } = request.params
          const teamTemplate = await controlPanelApp.deleteTeamTemplate(teamTemplateId)

          return reply
            .code(HttpStatus.Ok)
            .send({ message: 'Team template deleted successfully', teamTemplate })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    // Event Management
    server.get(
      '/control-panel/events',
      {
        preHandler: authGuard(server, { permissions: [EventPermissions.Read] }),
      },
      async (_, reply) => {
        try {
          const events = await controlPanelApp.listEvents()

          return reply.code(HttpStatus.Ok).send({
            events,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/control-panel/events/:eventId',
      {
        schema: {
          params: eventIdParamSchema,
        },

        preHandler: authGuard(server, { permissions: [EventPermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const event = await controlPanelApp.getEvent(eventId)

          return reply.code(HttpStatus.Ok).send(event)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/control-panel/events',
      {
        schema: { body: createEventBodySchema },

        preHandler: authGuard(server, { permissions: [EventPermissions.Create] }),
      },
      async (request, reply) => {
        try {
          const event = await controlPanelApp.createEvent(request.body)

          return reply.code(HttpStatus.Ok).header('location', `/events/${event.id}`).send({ event })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.patch(
      '/control-panel/events/:eventId',
      {
        schema: { params: eventIdParamSchema, body: updateEventBodySchema },

        preHandler: authGuard(server, { permissions: [EventPermissions.Update] }),
      },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const event = await controlPanelApp.updateEvent(eventId, request.body)

          return reply.code(HttpStatus.Ok).send({ event })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.delete(
      '/control-panel/events/:eventId',
      {
        schema: { params: eventIdParamSchema },

        preHandler: authGuard(server, { permissions: [EventPermissions.Delete] }),
      },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const event = await controlPanelApp.deleteEvent(eventId)

          return reply.code(HttpStatus.Ok).send({ message: `${event.name} deleted successfuly.` })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/control-panel/events/:eventId/current',
      {
        schema: { params: eventIdParamSchema },

        preHandler: authGuard(server, { permissions: [EventPermissions.Update] }),
      },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const event = await controlPanelApp.setCurrentEvent(eventId)

          return reply.code(HttpStatus.Ok).send({
            event,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
