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
  addMembersBodySchema,
  applyAssignmentsBodySchema,
  candidatesQuerySchema,
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
        schema: { params: teamInstanceParamsSchema, querystring: candidatesQuerySchema },
        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { teamInstanceId } = request.params
          const { role } = request.query
          const result = await teamBuildingApp.listCandidates(teamInstanceId, role)

          return reply.code(HttpStatus.Ok).send(result)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/team-building/teams/:teamInstanceId/members',
      {
        schema: { params: teamInstanceParamsSchema, body: addMembersBodySchema },
        preHandler: authGuard(server, { permissions: [TeamMembershipPermissions.Create] }),
      },
      async (request, reply) => {
        try {
          const { teamInstanceId } = request.params
          const { userIds } = request.body
          await teamBuildingApp.addMembers(teamInstanceId, userIds)

          return reply.code(HttpStatus.Ok).send({})
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
