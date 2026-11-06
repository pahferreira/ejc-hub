import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import type { Permission } from '../../../../common/permissions/permissions.types.ts'
import type { FastifyServerInstance } from '../fastify.types.ts'
import type { Observability } from '../../core/observability/domain/Observability.ts'
import { registerObservability } from '../fastify-observability.ts'
import { HttpStatus } from '../http-statuses.ts'

const noopObservability: Observability = {
  captureError: () => {},
  shutdown: async () => {},
}

const toBase64Url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

/**
 * An unsigned JWT carrying the claims the routes read: the subject and its
 * permissions. Never verified — the fake `requireAuth` below trusts it, the
 * way the real one trusts a token Auth0 signed.
 */
export function fakeToken(claims: { sub?: string; permissions?: Permission[] } = {}): string {
  const payload = { sub: claims.sub ?? 'auth0|tester', permissions: claims.permissions ?? [] }
  return `${toBase64Url({ alg: 'none', typ: 'JWT' })}.${toBase64Url(payload)}.signature`
}

/** The `authorization` header for `inject`, carrying a `fakeToken`. */
export function authHeader(claims: Parameters<typeof fakeToken>[0] = {}) {
  return { authorization: `Bearer ${fakeToken(claims)}` }
}

function bearerToken(header: string | undefined): string | undefined {
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
}

/**
 * A Fastify instance wired like `server.ts`, for testing a feature's routes
 * with `inject`: Zod validation, the shared error handling, and a stand-in for
 * the Auth0 plugin.
 *
 * The stand-in answers 401 without a bearer token and otherwise accepts it
 * unverified, so `authGuard`'s permission check runs against the token's own
 * claims. Mock the feature's application layer with `vi.mock` before
 * importing its routes, so nothing reaches the database.
 */
export async function buildRouteTestServer(
  routes: (server: FastifyServerInstance) => () => void
): Promise<FastifyServerInstance> {
  const server = Fastify().withTypeProvider<ZodTypeProvider>()

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  server.setSerializerCompiler(serializerCompiler)
  server.setValidatorCompiler(validatorCompiler)
  registerObservability(server, noopObservability)

  server.decorateRequest('getToken', function () {
    return bearerToken(this.headers.authorization)
  })

  server.decorate('requireAuth', () => async (request, reply) => {
    const token = request.getToken()

    if (!token) {
      return reply.code(HttpStatus.Unauthorized).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as {
      sub: string
    }
    request.user = { sub: payload.sub }
  })

  server.register(routes(server))
  await server.ready()

  return server
}
