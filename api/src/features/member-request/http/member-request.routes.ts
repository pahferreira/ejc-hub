import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { extractUserInformationFromToken } from '../../../shared/extract-user-info-from-token.ts'
import { MemberRequestPermissions } from '../../../../../common/permissions/permissions.types.ts'
import { memberRequestApp } from '../application/member-request-app.ts'
import {
  createMemberRequestsBodySchema,
  listMemberRequestsQuerystringSchema,
  listMyTeamRequestsQuerystringSchema,
  listRequestableCandidatesQuerystringSchema,
  memberRequestParamsSchema,
  resolveMemberRequestBodySchema,
} from './member-request.schema.ts'

/**
 * Who may answer a request.
 *
 * `any` of create-or-update rather than one of them, mirroring
 * `ADMIN_FEE_WRITE_PERMISSIONS`: the queue page gates its approve/deny buttons
 * on `hasAnyPermission([Create, Update])`, and requiring both here would ship
 * buttons that answer 403.
 */
const ADMIN_REQUEST_WRITE_PERMISSIONS = [
  MemberRequestPermissions.Create,
  MemberRequestPermissions.Update,
]

/**
 * The caller's Auth0 subject, or a 401 already sent.
 *
 * Every coordinator route needs it: the team they may act on is derived from
 * the caller rather than passed in, so there is nothing to do without it.
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

// Every acting route resolves the caller the same way and reports the same
// `{ result }` shape; only what it does with the auth id differs. The reads
// below send their payload unwrapped, matching the other list endpoints.
async function handleAction(
  request: FastifyRequest,
  reply: FastifyReply,
  status: number,
  act: (actorAuthId: string) => Promise<unknown>
) {
  const authId = actorAuthIdOrUnauthorized(request, reply)

  if (!authId) {
    return reply
  }

  const result = await act(authId)

  return reply.code(status).send({ result })
}

export function memberRequestRoutes(server: FastifyServerInstance) {
  return () => {
    // Coordinator routes carry authentication only. The right to act depends on
    // which team the caller coordinates, which is data the token cannot express,
    // so `MemberRequest` enforces it against `team_memberships` and answers 403.
    server.post(
      '/member-requests',
      {
        schema: { body: createMemberRequestsBodySchema },
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          return await handleAction(request, reply, HttpStatus.Created, (authId) =>
            memberRequestApp.createRequests(authId, request.body.userIds, request.body.message)
          )
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    /**
     * Who the coordinator may ask for, plus the team's counts.
     *
     * A separate route from `/team-building/teams/:id/candidates`, which is
     * gated on `team-instances:read` — a permission no coordinator holds, and
     * granting it would open the whole team-building board.
     */
    server.get(
      '/member-requests/candidates',
      {
        schema: { querystring: listRequestableCandidatesQuerystringSchema },
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          const authId = actorAuthIdOrUnauthorized(request, reply)

          if (!authId) {
            return reply
          }

          const { name, skills, experience, preference, page, pageSize } = request.query
          const candidates = await memberRequestApp.listRequestableCandidates(
            authId,
            { name, skills, experience, preference },
            { page, pageSize }
          )

          return reply.code(HttpStatus.Ok).send(candidates)
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    server.get(
      '/member-requests/my-team',
      {
        schema: { querystring: listMyTeamRequestsQuerystringSchema },
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          const authId = actorAuthIdOrUnauthorized(request, reply)

          if (!authId) {
            return reply
          }

          const { name, status } = request.query
          const requests = await memberRequestApp.listMyTeamRequests(authId, { name, status })

          return reply.code(HttpStatus.Ok).send(requests)
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    // Action-on-a-resource, matching `/financial/event-fee/confirmations`.
    server.post(
      '/member-requests/:requestId/cancellation',
      {
        schema: { params: memberRequestParamsSchema },
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          return await handleAction(request, reply, HttpStatus.Ok, (authId) =>
            memberRequestApp.cancelRequest(authId, request.params.requestId)
          )
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    // Admin routes are permission-gated with no team scoping: the permission
    // *is* the rule.
    server.get(
      '/events/current/member-requests',
      {
        schema: { querystring: listMemberRequestsQuerystringSchema },
        preHandler: authGuard(server, { permissions: [MemberRequestPermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { status, disputed, name, teamKey, page, pageSize } = request.query
          const requests = await memberRequestApp.listCurrentEventRequests(
            { status, disputed, name, teamKey },
            { page, pageSize }
          )

          return reply.code(HttpStatus.Ok).send(requests)
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )

    server.put(
      '/member-requests/admin/:requestId/status',
      {
        schema: { params: memberRequestParamsSchema, body: resolveMemberRequestBodySchema },
        preHandler: authGuard(server, {
          permissions: ADMIN_REQUEST_WRITE_PERMISSIONS,
          mode: 'any',
        }),
      },
      async (request, reply) => {
        try {
          return await handleAction(request, reply, HttpStatus.Ok, (authId) =>
            memberRequestApp.resolveRequest(
              authId,
              request.params.requestId,
              request.body.status,
              request.body.resolutionReason
            )
          )
        } catch (error) {
          fastifyErrorHandler(request, reply, error)
        }
      }
    )
  }
}
