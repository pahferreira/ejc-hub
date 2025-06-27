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

const updateTeamTemplateBodySchema = z.object({
  description: z.string().nonempty().optional(),
  name: z.string().nonempty().optional(),
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

    server.get('/teams/templates', async (_, reply) => {
      const teamTemplates = await teamTemplatesApp.listAll()

      return reply.code(HttpStatus.Ok).send({
        teamTemplates,
      })
    })

    server.patch(
      '/teams/templates/:teamTemplateId',
      {
        schema: {
          params: getTeamTemplateParamSchema,
          body: updateTeamTemplateBodySchema,
        },
      },
      async (request, reply) => {
        const { teamTemplateId } = request.params

        const teamTemplate = await teamTemplatesApp.updateTeamTemplate(teamTemplateId, request.body)

        if (!teamTemplate) {
          throw new Error('Something went wrong while updating this team template')
        }

        return reply.code(HttpStatus.Ok).send({
          teamTemplate,
        })
      }
    )

    server.delete(
      '/teams/templates/:teamTemplateId',
      {
        schema: {
          params: getTeamTemplateParamSchema,
        },
      },
      async (request, reply) => {
        const { teamTemplateId } = request.params

        const teamTemplate = await teamTemplatesApp.deleteTeamTemplate(teamTemplateId)

        if (!teamTemplate) {
          throw new Error('Something went wrong while deleting this team template')
        }

        return reply.code(HttpStatus.Ok).send({
          message: `${teamTemplate.name} was deleted successfuly.`,
        })
      }
    )
  }
}
