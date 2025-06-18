import fastify from 'fastify'
import { env } from './core/envs/env.ts'
import Auth0 from '@auth0/auth0-fastify-api'

const server = fastify({
  logger: true,
})

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
