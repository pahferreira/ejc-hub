import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'
import type { FastifyServerInstance } from './fastify.types.ts'
import type { Permission } from '../../../common/permissions/permissions.types.ts'
import { fastifyRequirePermission, type PermissionCheckMode } from './fastify-require-permission.ts'
import { bindRequestLogger } from './fastify-observability.ts'

export type AuthGuardOptions = {
  permissions?: Permission[]
  mode?: PermissionCheckMode
}

export function authGuard(
  server: FastifyServerInstance,
  options: AuthGuardOptions = {}
): preHandlerHookHandler[] {
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    await server.requireAuth()(request, reply)
    // After auth, so the verified person and their session land on every log
    // line for this request (and on its trace, through `instrumentation-pino`).
    bindRequestLogger(request)
  }

  // If no permissions specified, only require authentication
  if (!options.permissions || options.permissions.length === 0) {
    return [requireAuth]
  }

  const requirePermission = fastifyRequirePermission({
    permissions: options.permissions,
    mode: options.mode,
  })

  return [requireAuth, requirePermission]
}
