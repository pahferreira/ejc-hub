import { z } from 'zod/v4'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { controlPanelApp } from '../application/control-panel.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { EVENT_SUBSCRIPTION_MODES } from '../../../modules/event/domain/event-subscription-mode.ts'
import {
  EventPermissions,
  SubscriptionPermissions,
  TeamTemplatePermissions,
} from '../../../../../common/permissions/permissions.types.ts'

export const teamTemplateIdParamSchema = z.object({
  teamTemplateId: z.uuid('required'),
})

export const postTeamTemplateBodySchema = z.object({
  name: z.string('Team template name is required').nonempty('Team template cannot be empty'),
  key: z.string('Team template key is required').nonempty('Team template key cannot be empty'),
  description: z.string().optional(),
  maxCapacity: z.number().int().min(0, 'maxCapacity must be zero or greater').optional(),
})

const eventIdParamSchema = z.object({
  eventId: z.uuid(),
})

const createEventBodySchema = z.object({
  name: z.string('required').nonempty(),
  description: z.string('required').nonempty(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  location: z.string().optional(),
  song: z.string().optional(),
  theme: z.string().optional(),
  biblePassage: z.string().optional(),
})

const updateEventBodySchema = createEventBodySchema
  .partial()
  .extend({
    // Nullable so that null clears the value; omitting the key leaves it unchanged.
    location: z.string().nullable().optional(),
    song: z.string().nullable().optional(),
    theme: z.string().nullable().optional(),
    biblePassage: z.string().nullable().optional(),
    // Integer cents, matching events.fee_amount_cents. Update-only rather than
    // part of createEventBodySchema: the fee is decided — and raised — as the
    // event approaches, so a new event starts at the column default of 0.
    // Passing 0 clears the fee.
    feeAmountCents: z.number().int().min(0, 'feeAmountCents must be zero or greater').optional(),
  })
  .refine((data) => {
    // Compared against undefined rather than truthiness so that 0 counts as
    // present and can clear a previously set fee. The same goes for null on
    // the clearable text fields.
    return (
      data.name ||
      data.description ||
      data.feeAmountCents !== undefined ||
      data.location !== undefined ||
      data.song !== undefined ||
      data.theme !== undefined ||
      data.biblePassage !== undefined
    )
  }, 'At least one of the following attributes needs to be present: name, description, feeAmountCents, location, song, theme, biblePassage')

const subscriptionModeBodySchema = z.object({
  mode: z.enum(EVENT_SUBSCRIPTION_MODES),
})

export const patchTeamTemplateBodySchema = postTeamTemplateBodySchema
  .extend({
    maxAllowedCoordinators: z.number().int().min(1, 'must be at least 1').optional(),
  })
  .partial()
  .refine((data) => {
    return (
      data.name ||
      data.description ||
      data.maxCapacity !== undefined ||
      data.maxAllowedCoordinators !== undefined
    )
  }, 'At least one field (name, description, maxCapacity or maxAllowedCoordinators) is required for update')

export function controlPanelRoutes(server: FastifyServerInstance) {
  return () => {
    server.get('/circles', { preHandler: authGuard(server) }, async (_, reply) => {
      try {
        const circles = await controlPanelApp.listCircles()

        return reply.code(HttpStatus.Ok).send({ circles })
      } catch (error) {
        fastifyErrorHandler(reply, error)
      }
    })

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
          const { name, description, maxCapacity, maxAllowedCoordinators } = request.body
          const result = await controlPanelApp.updateTeamTemplate(teamTemplateId, {
            name,
            description,
            maxCapacity,
            maxAllowedCoordinators,
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

    server.patch(
      '/control-panel/events/:eventId/subscription-mode',
      {
        schema: { params: eventIdParamSchema, body: subscriptionModeBodySchema },

        preHandler: authGuard(server, { permissions: [EventPermissions.Update] }),
      },
      async (request, reply) => {
        try {
          const { eventId } = request.params
          const { mode } = request.body
          const event = await controlPanelApp.setEventSubscriptionMode(eventId, mode)

          return reply.code(HttpStatus.Ok).send({ event })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/control-panel/call-campaign/pdf',
      { preHandler: authGuard(server, { permissions: [SubscriptionPermissions.Read] }) },
      async (_, reply) => {
        try {
          const { buffer, filename } = await controlPanelApp.generateCallCampaignPdf()
          return reply
            .code(HttpStatus.Ok)
            .header('Content-Type', 'application/pdf')
            .header('Content-Disposition', `attachment; filename="${filename}"`)
            .send(buffer)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
