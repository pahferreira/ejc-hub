import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { SchedulePermissions } from '../../../../../common/permissions/permissions.types.ts'
import { scheduleApp } from '../application/schedule-app.ts'
import { createScheduleDayBodySchema, scheduleDayParamsSchema } from './schedule.schema.ts'

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
