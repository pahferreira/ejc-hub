import type {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { teamTemplatesApp } from '../application/TeamTemplates.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'

type FastifyServerInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  ZodTypeProvider
>

const createTeamTemplateBodySchema = z.object({
  description: z.string().optional(),
  key: z.string(),
  name: z.string(),
})

const getTeamTemplateParamSchema = z.object({
  teamTemplateId: z.uuid(),
})

export function teamTemplateRoutes(server: FastifyServerInstance) {
  return () => {
    server.post(
      '/teams/templates',
      {
        schema: {
          body: createTeamTemplateBodySchema,
        },
      },
      async (request, reply) => {
        const { description, key, name } = request.body

        const resultId = await teamTemplatesApp.createTeamTemplate({
          description,
          key,
          name,
        })

        return reply
          .code(HttpStatus.Created)
          .header('location', `/teams/templates/${resultId}`)
          .send(resultId)
      }
    )

    server.get(
      '/teams/templates/:teamTemplateId',
      {
        schema: {
          params: getTeamTemplateParamSchema,
        },
      },
      async (request, reply) => {
        const { teamTemplateId } = request.params
        const teamTemplate = await teamTemplatesApp.findOne(teamTemplateId)

        if (!teamTemplate) {
          return reply.code(HttpStatus.NotFound).send({
            message: 'Team template not found',
          })
        }

        return reply.code(HttpStatus.Ok).send({
          teamTemplate,
        })
      }
    )

    server.get('/teams/templates', async (request, reply) => {
      const teamTemplates = await teamTemplatesApp.listAll()

      return reply.code(HttpStatus.Ok).send({
        teamTemplates,
      })
    })
  }
}
