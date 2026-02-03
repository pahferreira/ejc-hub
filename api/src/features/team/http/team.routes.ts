import { z } from 'zod/v4'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { teamApp } from '../application/team.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import {
  TeamInstancePermissions,
  TeamMembershipPermissions,
} from '../../../../../common/permissions/permissions.types.ts'

const teamIdParamSchema = z.object({
  teamId: z.uuid('required'),
})

const getTeamsQueryStringSchema = z.object({
  eventId: z.string().optional(),
})

const postTeamMemberBodySchema = z.object({
  memberId: z.uuid('required'),
})

const deleteTeamMemberParamSchema = teamIdParamSchema.and(
  z.object({
    memberId: z.string('required'),
  })
)

const patchTeamBodySchema = z
  .object({
    firstCoordinatorId: z.uuid().optional(),
    secondCoordinatorId: z.uuid().optional(),
  })
  .refine(
    (data) => data.firstCoordinatorId || data.secondCoordinatorId,
    'At least one coordinator is required'
  )

export function teamRoutes(server: FastifyServerInstance) {
  return () => {
    server.get(
      '/teams',
      {
        schema: { querystring: getTeamsQueryStringSchema },

        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { eventId } = request.query
          const teams = await teamApp.listTeams(eventId)

          return reply.code(HttpStatus.Ok).send({
            teams,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/teams/:teamId',
      {
        schema: { params: teamIdParamSchema },

        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { teamId } = request.params
          const team = await teamApp.getTeam(teamId)

          return reply.code(HttpStatus.Ok).send({ team })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/teams/options',
      {
        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const teamOptions = await teamApp.listTeamOptions()

          return reply.code(HttpStatus.Ok).send({ teamOptions })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/teams/:teamId/members',
      {
        schema: { body: postTeamMemberBodySchema, params: teamIdParamSchema },

        preHandler: authGuard(server, { permissions: [TeamMembershipPermissions.Create] }),
      },
      async (request, reply) => {
        try {
          const { teamId } = request.params
          const { memberId } = request.body
          const teamMembership = await teamApp.addMember(teamId, memberId)

          return reply.code(HttpStatus.Ok).send({ teamMembership })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.delete(
      '/teams/:teamId/members/:memberId',
      {
        schema: { params: deleteTeamMemberParamSchema },

        preHandler: authGuard(server, { permissions: [TeamMembershipPermissions.Delete] }),
      },
      async (request, reply) => {
        try {
          const { teamId, memberId } = request.params
          const deletedMembership = await teamApp.removeMember(teamId, memberId)

          return reply.code(HttpStatus.Ok).send({ deletedMembership })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.patch(
      '/teams/:teamId',
      {
        schema: { body: patchTeamBodySchema, params: teamIdParamSchema },

        preHandler: authGuard(server, { permissions: [TeamInstancePermissions.Update] }),
      },
      async (request, reply) => {
        try {
          const { teamId } = request.params
          const { firstCoordinatorId, secondCoordinatorId } = request.body
          const team = await teamApp.assignCoordinators(teamId, {
            firstCoordId: firstCoordinatorId,
            secondCoordId: secondCoordinatorId,
          })

          return reply.code(HttpStatus.Ok).send({ team })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
