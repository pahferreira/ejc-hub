import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The application layer is mocked so the routes never reach the database.
const teamBuildingApp = vi.hoisted(() => ({
  getCurrentEventBoard: vi.fn(),
  applyAssignments: vi.fn(),
  listCandidates: vi.fn(),
  addMembers: vi.fn(),
  assignCoordinators: vi.fn(),
}))

vi.mock('../application/team-building-app.ts', () => ({ teamBuildingApp }))

import { teamBuildingRoutes } from './team-building.routes.ts'
import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import {
  TeamInstancePermissions,
  TeamMembershipPermissions,
} from '../../../../../common/permissions/permissions.types.ts'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { authHeader, buildRouteTestServer } from '../../../shared/testing/route-test-server.ts'

const TEAM_ID = '3c7f7b1a-7a4a-4b2b-8e1f-6a3b4c5d6e7f'
const USER_ID = '7f0c2a52-8d2e-4c7b-9f43-1d1f3f0c9a11'

const ADMIN = authHeader({
  permissions: [
    TeamInstancePermissions.Read,
    TeamInstancePermissions.Update,
    TeamMembershipPermissions.Create,
    TeamMembershipPermissions.Update,
  ],
})

// One request per route that can reject with a business rule.
const ROUTES = {
  assignments: {
    method: 'POST',
    url: '/team-building/assignments',
    payload: { assignments: [{ userId: USER_ID, target: { kind: 'waiting_list' } }] },
  },
  candidates: {
    method: 'GET',
    url: `/team-building/teams/${TEAM_ID}/candidates?role=member`,
  },
  members: {
    method: 'POST',
    url: `/team-building/teams/${TEAM_ID}/members`,
    payload: { userIds: [USER_ID] },
  },
  coordinators: {
    method: 'PUT',
    url: `/team-building/teams/${TEAM_ID}/coordinators`,
    payload: { coordinatorIds: [USER_ID] },
  },
} as const

describe('team-building routes', () => {
  let server: FastifyServerInstance

  beforeEach(async () => {
    server = await buildRouteTestServer(teamBuildingRoutes)
  })

  afterEach(async () => {
    await server.close()
    vi.clearAllMocks()
  })

  it.each(Object.values(ROUTES))('answers $method $url with 401 without a token', async (route) => {
    const response = await server.inject(route)

    expect(response.statusCode).toBe(401)
  })

  describe('team or subscription outside the current event', () => {
    it.each([
      ['assignments', teamBuildingApp.applyAssignments],
      ['candidates', teamBuildingApp.listCandidates],
      ['members', teamBuildingApp.addMembers],
      ['coordinators', teamBuildingApp.assignCoordinators],
    ] as const)('answers %s with 404', async (name, appMethod) => {
      appMethod.mockRejectedValue(new AppError('Not here', AppErrorCode.NotFound))

      const response = await server.inject({ ...ROUTES[name], headers: ADMIN })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({ message: 'Not here', code: AppErrorCode.NotFound })
    })
  })

  describe('POST /team-building/teams/:teamInstanceId/members', () => {
    it('answers an already-placed member with 422 and the code the app translates', async () => {
      teamBuildingApp.addMembers.mockRejectedValue(
        new AppError('Already placed', AppErrorCode.MemberAlreadyAssigned)
      )

      const response = await server.inject({ ...ROUTES.members, headers: ADMIN })

      expect(response.statusCode).toBe(422)
      expect(response.json()).toEqual({
        message: 'Already placed',
        code: AppErrorCode.MemberAlreadyAssigned,
      })
    })

    it('answers an empty batch with 400 before reaching the core', async () => {
      const response = await server.inject({
        ...ROUTES.members,
        payload: { userIds: [] },
        headers: ADMIN,
      })

      expect(response.statusCode).toBe(400)
      expect(teamBuildingApp.addMembers).not.toHaveBeenCalled()
    })
  })
})
