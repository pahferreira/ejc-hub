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
          .code(201)
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
        const teamTemplate =
          await teamTemplatesApp.getTeamTemplateById(teamTemplateId)

        if (!teamTemplate) {
          return reply.code(404).send({
            message: 'Team template not found',
          })
        }

        return reply.code(200).send({
          teamTemplate,
        })
      }
    )
  }
}
