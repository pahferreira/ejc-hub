import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { extractUserInformationFromToken } from '../../../shared/extract-user-info-from-token.ts'
import { AttendancePermissions } from '../../../../../common/permissions/permissions.types.ts'
import { attendanceApp } from '../application/attendance-app.ts'
import {
  meetingParamsSchema,
  registerMeetingBodySchema,
  teamAttendanceParamsSchema,
  updateMeetingBodySchema,
} from './attendance.schema.ts'

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
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    // Authentication only, as above. Any member of a team in the current event
    // may read their own record; `Attendance` answers 403 for anyone without a
    // membership and returns only the caller's own rows.
    server.get(
      '/attendance/me',
      {
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          const authId = actorAuthIdOrUnauthorized(request, reply)

          if (!authId) {
            return reply
          }

          const readModel = await attendanceApp.getMyReadModel(authId)

          return reply.code(HttpStatus.Ok).send(readModel)
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    // Admin Team Detail. Its own endpoint rather than part of `GET /teams/:teamId`,
    // so `team-instances:read` alone never exposes attendance. The param is
    // named like the other `/teams/:teamId` routes, but it is the team instance
    // id; a team outside the current event answers 404.
    server.get(
      '/teams/:teamId/attendance',
      {
        schema: { params: teamAttendanceParamsSchema },
        preHandler: authGuard(server, { permissions: [AttendancePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const readModel = await attendanceApp.getTeamReadModel(request.params.teamId)

          return reply.code(HttpStatus.Ok).send(readModel)
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
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
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    // Another team's meeting and a missing one answer the same 403, so the ids
    // of other teams' meetings can't be probed from here.
    server.put(
      '/attendance/meetings/:meetingId',
      {
        schema: { params: meetingParamsSchema, body: updateMeetingBodySchema },
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          const authId = actorAuthIdOrUnauthorized(request, reply)

          if (!authId) {
            return reply
          }

          const result = await attendanceApp.updateMeeting(
            authId,
            request.params.meetingId,
            request.body
          )

          return reply.code(HttpStatus.Ok).send({ result })
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    server.delete(
      '/attendance/meetings/:meetingId',
      {
        schema: { params: meetingParamsSchema },
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          const authId = actorAuthIdOrUnauthorized(request, reply)

          if (!authId) {
            return reply
          }

          const result = await attendanceApp.deleteMeeting(authId, request.params.meetingId)

          return reply.code(HttpStatus.Ok).send({ result })
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )
  }
}
