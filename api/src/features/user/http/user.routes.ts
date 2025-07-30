import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { userApp } from '../application/user.ts'
import { fastifyRequireAuth } from '../../../shared/fastify-require-auth.ts'
import z from 'zod/v4'
import { extractUserInformationFromToken } from '../../../shared/extract-user-info-from-token.ts'

const updateUserInputSchema = z.object({
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
})

export function userRoutes(server: FastifyServerInstance) {
  return () => {
    server.post(
      '/users/sync',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      { preHandler: fastifyRequireAuth(server) },
      async (request, reply) => {
        const token = request.getToken()
        if (token) {
          const { authId, email, name, picture } = extractUserInformationFromToken(token)
          const user = await userApp.createUser({ authId, name, email, picture })

          return reply.code(HttpStatus.Ok).send({ user })
        }
      }
    )

    server.patch(
      '/users/profile',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      { schema: { body: updateUserInputSchema }, preHandler: fastifyRequireAuth(server) },
      async (request, reply) => {
        const token = request.getToken()
        if (token) {
          const { authId } = extractUserInformationFromToken(token)
          const user = await userApp.updateUser(authId, request.body)

          return reply.code(HttpStatus.Ok).send({ user })
        }
      }
    )
  }
}
