import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { extractUserInformationFromToken } from '../../../shared/extract-user-info-from-token.ts'
import { attendanceApp } from '../application/attendance-app.ts'
import { registerMeetingBodySchema } from './attendance.schema.ts'

/**
 * The caller's Auth0 subject, or a 401 already sent.
 *
 * The coordinator's team is derived from the caller rather than passed in, so
 * there is nothing to do without it.
 */
function actorAuthIdOrUnauthorized(request: FastifyRequest, reply: FastifyReply): string | null {
  const token = request.getToken()

  if (!token) {
    void reply.code(HttpStatus.Unauthorized).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    })

    return null
  }

  return extractUserInformationFromToken(token).authId
}

export function attendanceRoutes(server: FastifyServerInstance) {
  return () => {
    // Authentication only. Which team the caller may read is data the token
    // cannot express, so `Attendance` enforces it against `team_memberships` and
    // answers 403 for anyone who is not that team's coordinator.
    server.get(
      '/attendance/my-team',
      {
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          const authId = actorAuthIdOrUnauthorized(request, reply)

          if (!authId) {
            return reply
          }

          const readModel = await attendanceApp.getMyTeamReadModel(authId)

          return reply.code(HttpStatus.Ok).send(readModel)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/attendance/meetings',
      {
        schema: { body: registerMeetingBodySchema },
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          const authId = actorAuthIdOrUnauthorized(request, reply)

          if (!authId) {
            return reply
          }

          const result = await attendanceApp.registerMeeting(authId, request.body)

          return reply.code(HttpStatus.Created).send({ result })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
