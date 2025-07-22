import fastify from 'fastify'
import { env } from './core/envs/env.ts'
import Auth0 from '@auth0/auth0-fastify-api'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { eventsRoutes } from './features/event/http/events.routes.ts'
import { userRoutes } from './features/user/http/user.routes.ts'
import { teamRoutes } from './features/team/http/team.routes.ts'
import { controlPanelRoutes } from './features/control-panel/http/control-panel.routes.ts'

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

server.register(userRoutes(server))
server.register(eventsRoutes(server))
server.register(teamRoutes(server))
server.register(controlPanelRoutes(server))

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
