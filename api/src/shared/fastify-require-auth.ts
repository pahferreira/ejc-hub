import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FastifyServerInstance } from './fastify.types.ts'

export function fastifyRequireAuth(server: FastifyServerInstance) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await server.requireAuth()(request, reply)
  }
}
