import fastify from 'fastify'
import { env } from './config/env.ts'

const server = fastify({
  logger: true,
})

server.get('/ping', () => {
  return { message: 'pong' }
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
