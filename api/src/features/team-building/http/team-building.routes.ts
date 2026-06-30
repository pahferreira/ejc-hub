import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { teamBuildingApp } from '../application/team-building-app.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import {
  TeamInstancePermissions,
  TeamMembershipPermissions,
} from '../../../../../common/permissions/permissions.types.ts'
import { applyAssignmentsBodySchema } from './team-building.schema.ts'

export function teamBuildingRoutes(server: FastifyServerInstance) {
  return () => {
    server.get(
      '/team-building/board',
      {
        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Read] }),
      },
      async (_, reply) => {
        try {
          const board = await teamBuildingApp.getCurrentEventBoard()

          return reply.code(HttpStatus.Ok).send({ board })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/team-building/assignments',
      {
        schema: { body: applyAssignmentsBodySchema },
        preHandler: authGuard(server, { permissions: [TeamMembershipPermissions.Update] }),
      },
      async (request, reply) => {
        try {
          const board = await teamBuildingApp.applyAssignments(request.body.assignments)

          return reply.code(HttpStatus.Ok).send({ board })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
