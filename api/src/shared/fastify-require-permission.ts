import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Permission } from '../../../common/permissions/permissions.types.ts'
import { extractUserInformationFromToken } from './extract-user-info-from-token.ts'
import { HttpStatus } from './http-statuses.ts'

export type PermissionCheckMode = 'all' | 'any'

export type PermissionOptions = {
  permissions: Permission[]
  mode?: PermissionCheckMode
}

export function fastifyRequirePermission(options: PermissionOptions) {
  const { permissions, mode = 'all' } = options

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.getToken()

    if (!token) {
      return reply.code(HttpStatus.Unauthorized).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    const { permissions: userPermissions } = extractUserInformationFromToken(token)

    const hasPermission =
      mode === 'all'
        ? permissions.every((p) => userPermissions.includes(p))
        : permissions.some((p) => userPermissions.includes(p))

    if (!hasPermission) {
      return reply.code(HttpStatus.Forbidden).send({
        error: 'Forbidden',
        message: `Missing required permission(s): ${permissions.join(', ')}`,
      })
    }
  }
}
