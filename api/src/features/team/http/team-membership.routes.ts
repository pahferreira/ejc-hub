import { z } from 'zod/v4'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { teamMembershipApp } from '../application/team.ts'

const teamMembershipIdParamSchema = z.object({
  teamMembershipId: z.uuid('required'),
})

const teamMembershipBodySchema = z.object({
  userId: z.string('required'),
  teamId: z.string('required'),
})

export function teamMembershipRoutes(server: FastifyServerInstance) {
  return () => {
    server.get('/teams/memberships', async (_, reply) => {
      try {
        const teamMemberships = await teamMembershipApp.listTeamMemberships()

        return reply.code(HttpStatus.Ok).send({
          teamMemberships,
        })
      } catch (error) {
        fastifyErrorHandler(reply, error)
      }
    })

    server.get(
      '/teams/memberships/:teamMembershipId',
      { schema: { params: teamMembershipIdParamSchema } },
      async (request, reply) => {
        try {
          const { teamMembershipId } = request.params
          const teamMembership = await teamMembershipApp.getTeamMembership(teamMembershipId)

          return reply.code(HttpStatus.Ok).send({
            teamMembership,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.delete(
      '/teams/membership/:teamMembershipId',
      { schema: { params: teamMembershipIdParamSchema } },
      async (request, reply) => {
        try {
          const { teamMembershipId } = request.params
          const deletedTeamMembership = teamMembershipApp.deleteTeamMembership(teamMembershipId)

          return reply.code(HttpStatus.Ok).send({
            message: `Membership ${(await deletedTeamMembership).id} was deleted successfuly.`,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/teams/membership',
      { schema: { body: teamMembershipBodySchema } },
      async (request, reply) => {
        try {
          const { userId, teamId } = request.body
          const result = await teamMembershipApp.createTeamMembership({
            userId,
            teamId,
          })

          return reply
            .code(HttpStatus.Created)
            .header('location', `/teams/memberships/${result?.id}`)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
