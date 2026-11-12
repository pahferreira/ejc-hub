import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The application layer is mocked so the routes never reach the database.
const scheduleApp = vi.hoisted(() => ({
  getSchedule: vi.fn(),
  createDay: vi.fn(),
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
  updateDay: vi.fn(),
  deleteDay: vi.fn(),
}))

vi.mock('../application/schedule-app.ts', () => ({ scheduleApp }))

import { scheduleRoutes } from './schedule.routes.ts'
import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { SchedulePermissions } from '../../../../../common/permissions/permissions.types.ts'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { authHeader, buildRouteTestServer } from '../../../shared/testing/route-test-server.ts'

const DAY_ID = '7f0c2a52-8d2e-4c7b-9f43-1d1f3f0c9a11'
const ACTIVITY_ID = '2b6e6a0f-6f3f-4a1a-9d0e-5f2a3b4c5d6e'
const TEAM_ID = '3c7f7b1a-7a4a-4b2b-8e1f-6a3b4c5d6e7f'

// A valid activity body the overlap/responsible rules in the core would accept.
const ACTIVITY_BODY = {
  dayId: DAY_ID,
  title: 'Acolhida',
  plannedStartsAt: '2026-04-03T21:00:00Z',
  durationMinutes: 30,
  place: 'Salão',
  teamInstanceIds: [TEAM_ID],
  guestName: null,
  adminsResponsible: false,
  allTeams: false,
}

const ADMIN = authHeader({
  permissions: [
    SchedulePermissions.Create,
    SchedulePermissions.Read,
    SchedulePermissions.Update,
    SchedulePermissions.Delete,
  ],
})

describe('schedule routes', () => {
  let server: FastifyServerInstance

  beforeEach(async () => {
    scheduleApp.getSchedule.mockResolvedValue({
      event: { name: 'EJC 2026', startDate: '2026-04-03', endDate: '2026-04-05' },
      myTeamInstanceId: TEAM_ID,
      viewerRole: 'member',
      days: [{ id: DAY_ID, date: '2026-04-03', activityCount: 2 }],
    })
    scheduleApp.createDay.mockResolvedValue({ dayId: DAY_ID, date: '2026-04-03' })
    scheduleApp.createActivity.mockResolvedValue({ activityId: ACTIVITY_ID })
    scheduleApp.updateDay.mockResolvedValue({ dayId: DAY_ID, date: '2026-04-04' })
    scheduleApp.deleteDay.mockResolvedValue({ dayId: DAY_ID })
    scheduleApp.updateActivity.mockResolvedValue({ activityId: ACTIVITY_ID })
    scheduleApp.deleteActivity.mockResolvedValue({ activityId: ACTIVITY_ID })

    server = await buildRouteTestServer(scheduleRoutes)
  })

  afterEach(async () => {
    await server.close()
    vi.clearAllMocks()
  })

  describe('authentication', () => {
    it.each([
      ['GET', '/schedule', {}],
      ['POST', '/schedule/days', { date: '2026-04-03' }],
      ['POST', '/schedule/activities', ACTIVITY_BODY],
      ['PATCH', `/schedule/days/${DAY_ID}`, { date: '2026-04-04' }],
      ['DELETE', `/schedule/days/${DAY_ID}`, {}],
      ['PATCH', `/schedule/activities/${ACTIVITY_ID}`, ACTIVITY_BODY],
      ['DELETE', `/schedule/activities/${ACTIVITY_ID}`, {}],
    ] as const)('answers %s %s with 401 without a token', async (method, url, payload) => {
      const response = await server.inject({ method, url, payload })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /schedule', () => {
    it('answers the schedule read model to a team member without schedule:read', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/schedule',
        headers: authHeader({ sub: 'auth0|member' }),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        event: { name: 'EJC 2026', startDate: '2026-04-03', endDate: '2026-04-05' },
        myTeamInstanceId: TEAM_ID,
        viewerRole: 'member',
        days: [{ id: DAY_ID, date: '2026-04-03', activityCount: 2 }],
      })
    })

    it('hands the core the caller and their permissions to decide on', async () => {
      await server.inject({
        method: 'GET',
        url: '/schedule',
        headers: authHeader({ sub: 'auth0|admin', permissions: [SchedulePermissions.Read] }),
      })

      expect(scheduleApp.getSchedule).toHaveBeenCalledWith({
        authId: 'auth0|admin',
        permissions: [SchedulePermissions.Read],
      })
    })

    it('answers 403 to a caller the core refuses (an outsider)', async () => {
      scheduleApp.getSchedule.mockRejectedValue(
        new AppError('Not on a team', AppErrorCode.Forbidden)
      )

      const response = await server.inject({
        method: 'GET',
        url: '/schedule',
        headers: authHeader({ sub: 'auth0|outsider' }),
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('POST /schedule/days', () => {
    it('creates a day for a caller with schedule:create', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/schedule/days',
        headers: ADMIN,
        payload: { date: '2026-04-03' },
      })

      expect(response.statusCode).toBe(201)
      expect(response.json()).toEqual({ result: { dayId: DAY_ID, date: '2026-04-03' } })
      expect(scheduleApp.createDay).toHaveBeenCalledWith({ date: '2026-04-03' })
    })

    it('refuses a caller without schedule:create', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/schedule/days',
        headers: authHeader({ permissions: [SchedulePermissions.Read] }),
        payload: { date: '2026-04-03' },
      })

      expect(response.statusCode).toBe(403)
      expect(scheduleApp.createDay).not.toHaveBeenCalled()
    })

    it.each([
      ['a date that is not YYYY-MM-DD', { date: '03/04/2026' }],
      ['no date', {}],
    ])('answers 400 for %s', async (_label, payload) => {
      const response = await server.inject({
        method: 'POST',
        url: '/schedule/days',
        headers: ADMIN,
        payload,
      })

      expect(response.statusCode).toBe(400)
      expect(scheduleApp.createDay).not.toHaveBeenCalled()
    })
  })

  describe('POST /schedule/activities', () => {
    it('creates an activity for a caller with schedule:create', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/schedule/activities',
        headers: ADMIN,
        payload: ACTIVITY_BODY,
      })

      expect(response.statusCode).toBe(201)
      expect(response.json()).toEqual({ result: { activityId: ACTIVITY_ID } })
      expect(scheduleApp.createActivity).toHaveBeenCalledWith({
        dayId: DAY_ID,
        title: 'Acolhida',
        plannedStartsAt: '2026-04-03T21:00:00Z',
        durationMinutes: 30,
        place: 'Salão',
        teamInstanceIds: [TEAM_ID],
        guestName: null,
        adminsResponsible: false,
        allTeams: false,
      })
    })

    it('defaults the optional fields when they are omitted', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/schedule/activities',
        headers: ADMIN,
        payload: {
          dayId: DAY_ID,
          title: 'Acolhida',
          plannedStartsAt: '2026-04-03T21:00:00Z',
          durationMinutes: 30,
          place: 'Salão',
        },
      })

      expect(response.statusCode).toBe(201)
      expect(scheduleApp.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          teamInstanceIds: [],
          guestName: null,
          adminsResponsible: false,
          allTeams: false,
        })
      )
    })

    it('hands the core an all-teams activity with no team ids', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/schedule/activities',
        headers: ADMIN,
        payload: { ...ACTIVITY_BODY, teamInstanceIds: [], allTeams: true },
      })

      expect(response.statusCode).toBe(201)
      expect(scheduleApp.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({ teamInstanceIds: [], allTeams: true })
      )
    })

    it('answers 400 when the core refuses all teams together with picked teams', async () => {
      scheduleApp.createActivity.mockRejectedValue(
        new AppError('All teams cannot be combined with picked teams', AppErrorCode.Validation)
      )

      const response = await server.inject({
        method: 'POST',
        url: '/schedule/activities',
        headers: ADMIN,
        payload: { ...ACTIVITY_BODY, allTeams: true },
      })

      expect(response.statusCode).toBe(400)
    })

    it('refuses a caller without schedule:create', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/schedule/activities',
        headers: authHeader({ permissions: [SchedulePermissions.Read] }),
        payload: ACTIVITY_BODY,
      })

      expect(response.statusCode).toBe(403)
      expect(scheduleApp.createActivity).not.toHaveBeenCalled()
    })

    it.each([
      ['a start that is not an ISO instant', { ...ACTIVITY_BODY, plannedStartsAt: '2026-04-03' }],
      ['a duration of zero', { ...ACTIVITY_BODY, durationMinutes: 0 }],
      ['a negative duration', { ...ACTIVITY_BODY, durationMinutes: -15 }],
      ['no title', { ...ACTIVITY_BODY, title: '' }],
      ['no place', { ...ACTIVITY_BODY, place: '' }],
      ['a day id that is not a uuid', { ...ACTIVITY_BODY, dayId: 'not-a-uuid' }],
    ])('answers 400 for %s', async (_label, payload) => {
      const response = await server.inject({
        method: 'POST',
        url: '/schedule/activities',
        headers: ADMIN,
        payload,
      })

      expect(response.statusCode).toBe(400)
      expect(scheduleApp.createActivity).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /schedule/days/:dayId', () => {
    it('moves a day for a caller with schedule:update', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/schedule/days/${DAY_ID}`,
        headers: ADMIN,
        payload: { date: '2026-04-04' },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ result: { dayId: DAY_ID, date: '2026-04-04' } })
      expect(scheduleApp.updateDay).toHaveBeenCalledWith(DAY_ID, { date: '2026-04-04' })
    })

    it('refuses a caller without schedule:update', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/schedule/days/${DAY_ID}`,
        headers: authHeader({
          permissions: [SchedulePermissions.Create, SchedulePermissions.Delete],
        }),
        payload: { date: '2026-04-04' },
      })

      expect(response.statusCode).toBe(403)
      expect(scheduleApp.updateDay).not.toHaveBeenCalled()
    })

    it('answers 409 when another day already has the date', async () => {
      scheduleApp.updateDay.mockRejectedValue(
        new AppError('The event already has a day on this date', AppErrorCode.Conflict)
      )

      const response = await server.inject({
        method: 'PATCH',
        url: `/schedule/days/${DAY_ID}`,
        headers: ADMIN,
        payload: { date: '2026-04-04' },
      })

      expect(response.statusCode).toBe(409)
    })

    it.each([
      ['a date that is not YYYY-MM-DD', `/schedule/days/${DAY_ID}`, { date: '04/04/2026' }],
      ['no date', `/schedule/days/${DAY_ID}`, {}],
      ['a day id that is not a uuid', '/schedule/days/not-a-uuid', { date: '2026-04-04' }],
    ])('answers 400 for %s', async (_label, url, payload) => {
      const response = await server.inject({ method: 'PATCH', url, headers: ADMIN, payload })

      expect(response.statusCode).toBe(400)
      expect(scheduleApp.updateDay).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /schedule/days/:dayId', () => {
    it('deletes a day for a caller with schedule:delete', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/schedule/days/${DAY_ID}`,
        headers: ADMIN,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ result: { dayId: DAY_ID } })
    })

    it('refuses a caller without schedule:delete', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/schedule/days/${DAY_ID}`,
        headers: authHeader({ permissions: [SchedulePermissions.Create] }),
      })

      expect(response.statusCode).toBe(403)
      expect(scheduleApp.deleteDay).not.toHaveBeenCalled()
    })

    it('answers 400 for a day id that is not a uuid', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/schedule/days/not-a-uuid',
        headers: ADMIN,
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('PATCH /schedule/activities/:activityId', () => {
    it('edits an activity for a caller with schedule:update', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/schedule/activities/${ACTIVITY_ID}`,
        headers: ADMIN,
        payload: ACTIVITY_BODY,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ result: { activityId: ACTIVITY_ID } })
      expect(scheduleApp.updateActivity).toHaveBeenCalledWith(ACTIVITY_ID, {
        dayId: DAY_ID,
        title: 'Acolhida',
        plannedStartsAt: '2026-04-03T21:00:00Z',
        durationMinutes: 30,
        place: 'Salão',
        teamInstanceIds: [TEAM_ID],
        guestName: null,
        adminsResponsible: false,
        allTeams: false,
      })
    })

    it('hands the core an edit to all teams with no team ids', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/schedule/activities/${ACTIVITY_ID}`,
        headers: ADMIN,
        payload: { ...ACTIVITY_BODY, teamInstanceIds: [], allTeams: true },
      })

      expect(response.statusCode).toBe(200)
      expect(scheduleApp.updateActivity).toHaveBeenCalledWith(
        ACTIVITY_ID,
        expect.objectContaining({ teamInstanceIds: [], allTeams: true })
      )
    })

    it('hands the core an edit back to picked teams', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/schedule/activities/${ACTIVITY_ID}`,
        headers: ADMIN,
        payload: { ...ACTIVITY_BODY, teamInstanceIds: [TEAM_ID], allTeams: false },
      })

      expect(response.statusCode).toBe(200)
      expect(scheduleApp.updateActivity).toHaveBeenCalledWith(
        ACTIVITY_ID,
        expect.objectContaining({ teamInstanceIds: [TEAM_ID], allTeams: false })
      )
    })

    it('answers 400 when the core refuses all teams together with picked teams', async () => {
      scheduleApp.updateActivity.mockRejectedValue(
        new AppError('All teams cannot be combined with picked teams', AppErrorCode.Validation)
      )

      const response = await server.inject({
        method: 'PATCH',
        url: `/schedule/activities/${ACTIVITY_ID}`,
        headers: ADMIN,
        payload: { ...ACTIVITY_BODY, allTeams: true },
      })

      expect(response.statusCode).toBe(400)
    })

    it('refuses a caller without schedule:update', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/schedule/activities/${ACTIVITY_ID}`,
        headers: authHeader({ permissions: [SchedulePermissions.Create] }),
        payload: ACTIVITY_BODY,
      })

      expect(response.statusCode).toBe(403)
      expect(scheduleApp.updateActivity).not.toHaveBeenCalled()
    })

    it.each([
      [
        'a duration of zero',
        `/schedule/activities/${ACTIVITY_ID}`,
        { ...ACTIVITY_BODY, durationMinutes: 0 },
      ],
      ['no title', `/schedule/activities/${ACTIVITY_ID}`, { ...ACTIVITY_BODY, title: '' }],
      ['an activity id that is not a uuid', '/schedule/activities/not-a-uuid', ACTIVITY_BODY],
    ])('answers 400 for %s', async (_label, url, payload) => {
      const response = await server.inject({ method: 'PATCH', url, headers: ADMIN, payload })

      expect(response.statusCode).toBe(400)
      expect(scheduleApp.updateActivity).not.toHaveBeenCalled()
    })

    it('answers 404 when the activity is not found', async () => {
      scheduleApp.updateActivity.mockRejectedValue(
        new AppError('Schedule activity not found', AppErrorCode.NotFound)
      )

      const response = await server.inject({
        method: 'PATCH',
        url: `/schedule/activities/${ACTIVITY_ID}`,
        headers: ADMIN,
        payload: ACTIVITY_BODY,
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('DELETE /schedule/activities/:activityId', () => {
    it('deletes an activity for a caller with schedule:delete', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/schedule/activities/${ACTIVITY_ID}`,
        headers: ADMIN,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ result: { activityId: ACTIVITY_ID } })
      expect(scheduleApp.deleteActivity).toHaveBeenCalledWith(ACTIVITY_ID)
    })

    it('refuses a caller without schedule:delete', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/schedule/activities/${ACTIVITY_ID}`,
        headers: authHeader({ permissions: [SchedulePermissions.Update] }),
      })

      expect(response.statusCode).toBe(403)
      expect(scheduleApp.deleteActivity).not.toHaveBeenCalled()
    })

    it('answers 404 when the activity is not found', async () => {
      scheduleApp.deleteActivity.mockRejectedValue(
        new AppError('Schedule activity not found', AppErrorCode.NotFound)
      )

      const response = await server.inject({
        method: 'DELETE',
        url: `/schedule/activities/${ACTIVITY_ID}`,
        headers: ADMIN,
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('AppError codes', () => {
    it.each([
      [AppErrorCode.Validation, 400],
      [AppErrorCode.NotFound, 404],
      [AppErrorCode.Conflict, 409],
      [AppErrorCode.NoCurrentEvent, 422],
    ])('maps %s to %i', async (code, status) => {
      scheduleApp.createDay.mockRejectedValue(new AppError('Refused', code))

      const response = await server.inject({
        method: 'POST',
        url: '/schedule/days',
        headers: ADMIN,
        payload: { date: '2026-04-03' },
      })

      expect(response.statusCode).toBe(status)
      expect(response.json()).toEqual({ message: 'Refused', code })
    })
  })
})
