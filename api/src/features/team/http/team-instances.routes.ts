import { z } from 'zod/v4'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { teamInstanceApp } from '../application/team.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'

const createTeamInstanceBodySchema = z.object({
  templateKey: z.string().nonempty(),
  eventId: z.uuid(),
})

const teamInstanceIdParamSchema = z.object({
  teamInstanceId: z.uuid(),
})

export function teamInstanceRoutes(server: FastifyServerInstance) {
  return () => {
    server.post(
      '/teams/instances',
      { schema: { body: createTeamInstanceBodySchema } },
      async (request, reply) => {
        try {
          const { templateKey, eventId } = request.body
          const teamInstance = await teamInstanceApp.createTeamInstance(templateKey, eventId)

          return reply
            .code(HttpStatus.Created)
            .header('location', `/teams/instances/${teamInstance.id}`)
            .send({ teamInstance })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get('/teams/instances', async (_, reply) => {
      try {
        const teamInstances = await teamInstanceApp.listTeamInstances()

        return reply.code(HttpStatus.Ok).send({
          teamInstances,
        })
      } catch (error) {
        fastifyErrorHandler(reply, error)
      }
    })

    server.get(
      '/teams/instances/:teamInstanceId',
      { schema: { params: teamInstanceIdParamSchema } },
      async (request, reply) => {
        try {
          const { teamInstanceId } = request.params
          const teamInstance = await teamInstanceApp.getTeamInstance(teamInstanceId)

          return reply.code(HttpStatus.Ok).send({
            teamInstance,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
