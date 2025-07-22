import { z } from 'zod/v4'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { controlPanelApp } from '../application/control-panel.ts'

export const teamTemplateIdParamSchema = z.object({
  teamTemplateId: z.uuid('required'),
})

export const postTeamTemplateBodySchema = z.object({
  name: z.string('Team template name is required').nonempty('Team template cannot be empty'),
  key: z.string('Team template key is required').nonempty('Team template key cannot be empty'),
  description: z.string().optional(),
})

export const patchTeamTemplateBodySchema = postTeamTemplateBodySchema.partial().refine((data) => {
  return data.name || data.description
}, 'At least one field (name or description) is required for update')

export function controlPanelRoutes(server: FastifyServerInstance) {
  return () => {
    server.get('/control-panel/team-templates', async (request, reply) => {
      try {
        const teamTemplates = await controlPanelApp.listTeamTemplates()

        return reply.code(HttpStatus.Ok).send({
          teamTemplates,
        })
      } catch (error) {
        fastifyErrorHandler(reply, error)
      }
    })

    server.get(
      '/control-panel/team-templates/:teamTemplateId',
      { schema: { params: teamTemplateIdParamSchema } },
      async (request, reply) => {
        try {
          const { teamTemplateId } = request.params
          const teamTemplate = await controlPanelApp.getTeamTemplateById(teamTemplateId)

          return reply.code(HttpStatus.Ok).send({ teamTemplate })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/control-panel/team-templates',
      { schema: { body: postTeamTemplateBodySchema } },
      async (request, reply) => {
        try {
          const { name, key, description } = request.body
          const result = await controlPanelApp.createTeamTemplate({ name, key, description })

          return reply
            .code(HttpStatus.Created)
            .header('location', `/control-panel/team-templates/${result.id}`)
            .send({ result })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.patch(
      '/control-panel/team-templates/:teamTemplateId',
      { schema: { body: patchTeamTemplateBodySchema, params: teamTemplateIdParamSchema } },
      async (request, reply) => {
        try {
          const { teamTemplateId } = request.params
          const { name, description } = request.body
          const result = await controlPanelApp.updateTeamTemplate(teamTemplateId, {
            name,
            description,
          })

          return reply.code(HttpStatus.Ok).send({ result })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.delete(
      '/control-panel/team-templates/:teamTemplateId',
      { schema: { params: teamTemplateIdParamSchema } },
      async (request, reply) => {
        try {
          const { teamTemplateId } = request.params
          const teamTemplate = await controlPanelApp.deleteTeamTemplate(teamTemplateId)

          return reply
            .code(HttpStatus.Ok)
            .send({ message: 'Team template deleted successfully', teamTemplate })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
