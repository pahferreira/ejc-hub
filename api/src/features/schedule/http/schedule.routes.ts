import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z } from 'zod/v4'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { extractUserInformationFromToken } from '../../../shared/extract-user-info-from-token.ts'
import { SchedulePermissions } from '../../../../../common/permissions/permissions.types.ts'
import { scheduleApp } from '../application/schedule-app.ts'
import type { ScheduleActivityPlan, ScheduleViewer } from '../domain/schedule.types.ts'
import {
  createScheduleActivityBodySchema,
  createScheduleDayBodySchema,
  scheduleActivityBodySchema,
  scheduleActivityParamsSchema,
  scheduleDayParamsSchema,
  updateScheduleActivityBodySchema,
  updateScheduleDayBodySchema,
} from './schedule.schema.ts'

// The activity body as the core takes it: a missing guest becomes null.
function toActivityPlan(body: z.infer<typeof scheduleActivityBodySchema>): ScheduleActivityPlan {
  return {
    dayId: body.dayId,
    title: body.title,
    plannedStartsAt: body.plannedStartsAt,
    durationMinutes: body.durationMinutes,
    place: body.place,
    teamInstanceIds: body.teamInstanceIds,
    guestName: body.guestName ?? null,
    adminsResponsible: body.adminsResponsible,
  }
}

/**
 * The caller as the schedule read needs them, or a 401 already sent.
 *
 * Whether they may read is decided by `Schedule` from their permissions and
 * their team membership, so both travel with the call.
 */
function viewerOrUnauthorized(request: FastifyRequest, reply: FastifyReply): ScheduleViewer | null {
  const token = request.getToken()

  if (!token) {
    void reply.code(HttpStatus.Unauthorized).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    })

    return null
  }

  const { authId, permissions } = extractUserInformationFromToken(token)

  return { authId, permissions }
}

export function scheduleRoutes(server: FastifyServerInstance) {
  return () => {
    // Authentication only. Admins (`schedule:read`) and anyone on a team in the
    // current event may read; the token cannot express membership, so
    // `Schedule` decides and answers 403 for everyone else.
    server.get(
      '/schedule',
      {
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          const viewer = viewerOrUnauthorized(request, reply)

          if (!viewer) {
            return reply
          }

          const readModel = await scheduleApp.getSchedule(viewer)

          return reply.code(HttpStatus.Ok).send(readModel)
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    server.post(
      '/schedule/days',
      {
        schema: { body: createScheduleDayBodySchema },
        preHandler: authGuard(server, { permissions: [SchedulePermissions.Create] }),
      },
      async (request, reply) => {
        try {
          const result = await scheduleApp.createDay(request.body)

          return reply.code(HttpStatus.Created).send({ result })
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    server.post(
      '/schedule/activities',
      {
        schema: { body: createScheduleActivityBodySchema },
        preHandler: authGuard(server, { permissions: [SchedulePermissions.Create] }),
      },
      async (request, reply) => {
        try {
          const result = await scheduleApp.createActivity(toActivityPlan(request.body))

          return reply.code(HttpStatus.Created).send({ result })
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    server.patch(
      '/schedule/activities/:activityId',
      {
        schema: { params: scheduleActivityParamsSchema, body: updateScheduleActivityBodySchema },
        preHandler: authGuard(server, { permissions: [SchedulePermissions.Update] }),
      },
      async (request, reply) => {
        try {
          const result = await scheduleApp.updateActivity(
            request.params.activityId,
            toActivityPlan(request.body)
          )

          return reply.code(HttpStatus.Ok).send({ result })
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    server.delete(
      '/schedule/activities/:activityId',
      {
        schema: { params: scheduleActivityParamsSchema },
        preHandler: authGuard(server, { permissions: [SchedulePermissions.Delete] }),
      },
      async (request, reply) => {
        try {
          const result = await scheduleApp.deleteActivity(request.params.activityId)

          return reply.code(HttpStatus.Ok).send({ result })
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    server.patch(
      '/schedule/days/:dayId',
      {
        schema: { params: scheduleDayParamsSchema, body: updateScheduleDayBodySchema },
        preHandler: authGuard(server, { permissions: [SchedulePermissions.Update] }),
      },
      async (request, reply) => {
        try {
          const result = await scheduleApp.updateDay(request.params.dayId, request.body)

          return reply.code(HttpStatus.Ok).send({ result })
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    server.delete(
      '/schedule/days/:dayId',
      {
        schema: { params: scheduleDayParamsSchema },
        preHandler: authGuard(server, { permissions: [SchedulePermissions.Delete] }),
      },
      async (request, reply) => {
        try {
          const result = await scheduleApp.deleteDay(request.params.dayId)

          return reply.code(HttpStatus.Ok).send({ result })
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )
  }
}
