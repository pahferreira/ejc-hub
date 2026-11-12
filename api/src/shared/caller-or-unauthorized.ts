import type { FastifyReply, FastifyRequest } from 'fastify'
import { extractUserInformationFromToken } from './extract-user-info-from-token.ts'
import { HttpStatus } from './http-statuses.ts'

/** Who is calling: their Auth0 subject and the permissions their token carries. */
export type Caller = {
  authId: string
  permissions: string[]
}

/**
 * The caller, or a 401 already sent.
 *
 * For routes whose core decides from the caller rather than from the token
 * alone (a team membership, a coordinated team). `authGuard` has already
 * refused a request without a token, so the 401 here only narrows the type.
 */
export function callerOrUnauthorized(request: FastifyRequest, reply: FastifyReply): Caller | null {
  const token = request.getToken()

  if (!token) {
    void reply.code(HttpStatus.Unauthorized).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    })

    return null
  }

  const { authId, permissions } = extractUserInformationFromToken(token)

  return { authId, permissions }
}
