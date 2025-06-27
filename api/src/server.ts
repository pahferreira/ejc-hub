import fastify from 'fastify'
import { env } from './core/envs/env.ts'
import Auth0 from '@auth0/auth0-fastify-api'
import { teamTemplateRoutes } from './features/team/http/team-templates.routes.ts'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { eventsRoutes } from './features/event/http/events.routes.ts'

const server = fastify({
  logger: true,
}).withTypeProvider<ZodTypeProvider>()

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
server.setSerializerCompiler(serializerCompiler)
server.setValidatorCompiler(validatorCompiler)

server.register(Auth0, {
  domain: env.AUTH_DOMAIN,
  audience: env.AUTH_AUDIENCE,
})

server.get('/ping', () => {
  return { message: 'pong' }
})

server.register(() => {
  server.get(
    '/private',
    {
      preHandler: void server.requireAuth(),
    },
    (request) => {
      console.log('user', request.user)
      return {
        message: 'private',
      }
    }
  )
})

server.register(teamTemplateRoutes(server))
server.register(eventsRoutes(server))

async function startServer() {
  try {
    await server.listen({ port: env.PORT })
    server.log.info(`Server is running on http://localhost:${env.PORT}`)
  } catch (err) {
    server.log.error(err)
  }
}

startServer().catch(() => {
  process.exit(1)
})
