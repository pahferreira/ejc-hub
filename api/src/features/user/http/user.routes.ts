import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { decodeJwt } from 'jose'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { userApp } from '../application/user.ts'
import { fastifyRequireAuth } from '../../../shared/fastify-require-auth.ts'

type UserInfo = {
  email: string
  name: string
  picture: string
}

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
  }
}

function extractUserInformationFromToken(token: string) {
  const user = decodeJwt<UserInfo>(token)

  return {
    authId: user.sub as string,
    email: user.email,
    name: user.name,
    picture: user.picture,
  }
}
