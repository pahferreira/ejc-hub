import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { teamBuildingApp } from '../application/team-building-app.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import {
  TeamInstancePermissions,
  TeamMembershipPermissions,
} from '../../../../../common/permissions/permissions.types.ts'
import {
  applyAssignmentsBodySchema,
  teamInstanceParamsSchema,
  setCoordinatorsBodySchema,
} from './team-building.schema.ts'

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

    server.get(
      '/team-building/teams/:teamInstanceId/candidates',
      {
        schema: { params: teamInstanceParamsSchema },
        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { teamInstanceId } = request.params
          const result = await teamBuildingApp.listCandidates(teamInstanceId)

          return reply.code(HttpStatus.Ok).send(result)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.put(
      '/team-building/teams/:teamInstanceId/coordinators',
      {
        schema: { params: teamInstanceParamsSchema, body: setCoordinatorsBodySchema },
        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Update] }),
      },
      async (request, reply) => {
        try {
          const { teamInstanceId } = request.params
          const { coordinatorIds } = request.body
          await teamBuildingApp.assignCoordinators(teamInstanceId, coordinatorIds)

          return reply.code(HttpStatus.Ok).send({})
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
