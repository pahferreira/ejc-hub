import type { z } from 'zod/v4'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { SchedulePermissions } from '../../../../../common/permissions/permissions.types.ts'
import { scheduleApp } from '../application/schedule-app.ts'
import type { ScheduleActivityPlan } from '../domain/schedule.types.ts'
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

export function scheduleRoutes(server: FastifyServerInstance) {
  return () => {
    // Admins only for now. The Cronograma read view opens it to anyone on a
    // team in the current event, which the core will decide from the data.
    server.get(
      '/schedule',
      {
        preHandler: authGuard(server, { permissions: [SchedulePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const readModel = await scheduleApp.getSchedule()

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
