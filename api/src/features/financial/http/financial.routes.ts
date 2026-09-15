import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { fastifyErrorHandler } from '../../../shared/fastify-error-handler.ts'
import { HttpStatus } from '../../../shared/http-statuses.ts'
import { authGuard } from '../../../shared/fastify-auth-guard.ts'
import { extractUserInformationFromToken } from '../../../shared/extract-user-info-from-token.ts'
import { financialApp } from '../application/financial.ts'
import { EventFeePermissions } from '../../../../../common/permissions/permissions.types.ts'
import {
  confirmFeeBodySchema,
  confirmFeesBatchBodySchema,
  feePaymentUserParamsSchema,
  listEventFeeMembersQuerystringSchema,
  setFeeStatusBatchBodySchema,
  setFeeStatusBodySchema,
} from './financial.schema.ts'

/**
 * Who may write a fee status through the admin routes.
 *
 * `any` of create-or-update rather than create alone: recording a payment for
 * someone who already has a row is an update, and the "Taxa por Membro" page
 * gates its confirm controls on `financials-event-fee:update`. Requiring only
 * `create` here would leave that page showing buttons that answer 403.
 */
const ADMIN_FEE_WRITE_PERMISSIONS = [EventFeePermissions.Create, EventFeePermissions.Update]

// Every fee-status route resolves the caller the same way and reports the same
// shape; only the targets, the status, and the authorization rule differ.
async function handleConfirmation(
  request: FastifyRequest,
  reply: FastifyReply,
  confirm: (actorAuthId: string) => Promise<unknown>
) {
  const token = request.getToken()

  if (!token) {
    return reply.code(HttpStatus.Unauthorized).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    })
  }

  const { authId } = extractUserInformationFromToken(token)
  const result = await confirm(authId)

  return reply.code(HttpStatus.Ok).send({ result })
}

export function financialRoutes(server: FastifyServerInstance) {
  return () => {
    // Two overviews rather than one shared payload: the by-member page renders
    // counts and the by-team page renders counts, a table and the money, so a
    // single endpoint would always be shipping one of them a payload it drops.
    server.get(
      '/events/current/event-fee-overview-members',
      {
        preHandler: authGuard(server, { permissions: [EventFeePermissions.Read] }),
      },
      async (_, reply) => {
        try {
          const overview = await financialApp.getCurrentEventMembersOverview()

          return reply.code(HttpStatus.Ok).send({ overview })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.get(
      '/events/current/event-fee-overview-teams',
      {
        preHandler: authGuard(server, { permissions: [EventFeePermissions.Read] }),
      },
      async (_, reply) => {
        try {
          const overview = await financialApp.getCurrentEventTeamsOverview()

          return reply.code(HttpStatus.Ok).send({ overview })
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    // The member-level read sibling of the overview above: same current-event
    // scope, same permission, one row per person instead of one per team.
    server.get(
      '/events/current/event-fee-members',
      {
        schema: { querystring: listEventFeeMembersQuerystringSchema },
        preHandler: authGuard(server, { permissions: [EventFeePermissions.Read] }),
      },
      async (request, reply) => {
        try {
          const { name, teamKey, status, page, pageSize } = request.query
          const members = await financialApp.listCurrentEventMemberFees(
            { name, teamKey, status },
            { page, pageSize }
          )

          return reply.code(HttpStatus.Ok).send(members)
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    // Coordinator routes carry no permission beyond authentication: the right to
    // confirm depends on who the caller coordinates, which is data the token
    // cannot express. `Financial` enforces it and answers 403 when it fails.
    server.post(
      '/financial/event-fee/confirmations',
      {
        schema: { body: confirmFeeBodySchema },
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          return await handleConfirmation(request, reply, (authId) =>
            financialApp.confirmTeamFeesAsCoordinator(authId, [request.body.userId])
          )
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.post(
      '/financial/event-fee/confirmations/batch',
      {
        schema: { body: confirmFeesBatchBodySchema },
        preHandler: authGuard(server),
      },
      async (request, reply) => {
        try {
          return await handleConfirmation(request, reply, (authId) =>
            financialApp.confirmTeamFeesAsCoordinator(authId, request.body.userIds)
          )
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    // Admin routes set any settable status rather than only confirming, so they
    // are a status resource, not a confirmation action. No team scoping: the
    // permission is the whole authorization rule.
    server.put(
      '/financial/event-fee/admin/payments/:userId/status',
      {
        schema: { params: feePaymentUserParamsSchema, body: setFeeStatusBodySchema },
        preHandler: authGuard(server, {
          permissions: ADMIN_FEE_WRITE_PERMISSIONS,
          mode: 'any',
        }),
      },
      async (request, reply) => {
        try {
          return await handleConfirmation(request, reply, (authId) =>
            financialApp.setFeeStatusAsAdmin(authId, [request.params.userId], request.body.status)
          )
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )

    server.put(
      '/financial/event-fee/admin/payments/status',
      {
        schema: { body: setFeeStatusBatchBodySchema },
        preHandler: authGuard(server, {
          permissions: ADMIN_FEE_WRITE_PERMISSIONS,
          mode: 'any',
        }),
      },
      async (request, reply) => {
        try {
          return await handleConfirmation(request, reply, (authId) =>
            financialApp.setFeeStatusAsAdmin(authId, request.body.userIds, request.body.status)
          )
        } catch (error) {
          fastifyErrorHandler(reply, error)
        }
      }
    )
  }
}
