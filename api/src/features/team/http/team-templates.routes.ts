import { z } from 'zod/v4'
import { teamTemplatesApp } from '../application/TeamTemplates.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'

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
        try {
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
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
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
        try {
          const { teamTemplateId } = request.params
          const teamTemplate = await teamTemplatesApp.findOne(teamTemplateId)

          return reply.code(HttpStatus.Ok).send({
            teamTemplate,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get('/teams/templates', async (_, reply) => {
      try {
        const teamTemplates = await teamTemplatesApp.listAll()

        return reply.code(HttpStatus.Ok).send({
          teamTemplates,
        })
      } catch (error) {
        fastifyErrorHandler(reply, error)
      }
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
        try {
          const { teamTemplateId } = request.params

          const teamTemplate = await teamTemplatesApp.updateTeamTemplate(
            teamTemplateId,
            request.body
          )

          return reply.code(HttpStatus.Ok).send({
            teamTemplate,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
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
        try {
          const { teamTemplateId } = request.params

          const teamTemplate = await teamTemplatesApp.deleteTeamTemplate(teamTemplateId)

          return reply.code(HttpStatus.Ok).send({
            message: `${teamTemplate.name} was deleted successfuly.`,
          })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
