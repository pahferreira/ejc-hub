import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { userApp } from '../application/user.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import z from 'zod/v4'
import { extractUserInformationFromToken } from '../../../shared/extract-user-info-from-token.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { UserPermissions } from '../../../../../common/permissions/permissions.types.ts'

const updateProfileInputSchema = z.object({
  // An email-shaped name would re-enable the syncProfile placeholder guard,
  // letting the next login overwrite it with the Auth0 token name.
  name: z
    .string()
    .nonempty('must not be empty')
    .refine((value) => !z.email().safeParse(value).success, 'must not be an email')
    .optional(),
  phone: z.string().nonempty('must not be empty').optional(),
  nickname: z.string().nonempty('must not be empty').optional(),
  dateOfBirth: z.string().nonempty('must not be empty').optional(),
  hasMusicSkills: z.boolean().optional(),
  hasActingSkills: z.boolean().optional(),
  hasDancingSkills: z.boolean().optional(),
  hasSingingSkills: z.boolean().optional(),
  hasManualSkills: z.boolean().optional(),
  hasCookingSkills: z.boolean().optional(),
  hasCommunicationSkills: z.boolean().optional(),
  hasGuitarSkills: z.boolean().optional(),
  hasPercussionSkills: z.boolean().optional(),
  hasMidiaSkills: z.boolean().optional(),
})

const updateUserInputSchema = updateProfileInputSchema.extend({
  circleKey: z.string().nonempty('must not be empty').optional(),
  experienceType: z.enum(['newbie', 'experienced', 'experienced_outsider']).optional(),
})

const listUsersQueryStringSchema = z.object({
  limit: z.coerce.number().int().min(1).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  search: z.string().trim().nonempty('must not be empty').optional(),
})

const userIdParamSchema = z.object({
  id: z.uuid('required'),
})

export function userRoutes(server: FastifyServerInstance) {
  return () => {
    server.get(
      '/users',
      {
        schema: { querystring: listUsersQueryStringSchema },

        preHandler: authGuard(server, { permissions: [UserPermissions.List] }),
      },
      async (request, reply) => {
        try {
          const { limit, offset, search } = request.query
          const users = await userApp.listUsers({ limit, offset, search })

          return reply.code(HttpStatus.Ok).send({ users })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.patch(
      '/users/:id',
      {
        schema: { body: updateUserInputSchema, params: userIdParamSchema },

        preHandler: authGuard(server, { permissions: [UserPermissions.Update] }),
      },
      async (request, reply) => {
        try {
          const { id } = request.params
          const user = await userApp.updateUserById(id, request.body)

          return reply.code(HttpStatus.Ok).send({ user })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post('/users/sync', { preHandler: authGuard(server) }, async (request, reply) => {
      const token = request.getToken()
      if (token) {
        const { authId, email, name, picture } = extractUserInformationFromToken(token)
        const user = await userApp.syncProfile({ authId, name, email, picture })

        return reply.code(HttpStatus.Ok).send({ user })
      }
    })

    server.patch(
      '/users/profile',
      { schema: { body: updateProfileInputSchema }, preHandler: authGuard(server) },
      async (request, reply) => {
        const token = request.getToken()
        if (token) {
          const { authId } = extractUserInformationFromToken(token)
          const user = await userApp.updateProfile(authId, request.body)

          return reply.code(HttpStatus.Ok).send({ user })
        }
      }
    )
  }
}
