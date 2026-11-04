import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The application layer is mocked so the routes never reach the database.
const scheduleApp = vi.hoisted(() => ({
  getSchedule: vi.fn(),
  createDay: vi.fn(),
  createActivity: vi.fn(),
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
      days: [{ id: DAY_ID, date: '2026-04-03', activityCount: 2 }],
    })
    scheduleApp.createDay.mockResolvedValue({ dayId: DAY_ID, date: '2026-04-03' })
    scheduleApp.createActivity.mockResolvedValue({ activityId: ACTIVITY_ID })
    scheduleApp.deleteDay.mockResolvedValue({ dayId: DAY_ID })

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
      ['DELETE', `/schedule/days/${DAY_ID}`, {}],
    ] as const)('answers %s %s with 401 without a token', async (method, url, payload) => {
      const response = await server.inject({ method, url, payload })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /schedule', () => {
    it('answers the schedule read model to a caller with schedule:read', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/schedule',
        headers: authHeader({ permissions: [SchedulePermissions.Read] }),
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        event: { name: 'EJC 2026', startDate: '2026-04-03', endDate: '2026-04-05' },
        days: [{ id: DAY_ID, date: '2026-04-03', activityCount: 2 }],
      })
    })

    it('refuses a caller without schedule:read', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/schedule',
        headers: authHeader({ permissions: [SchedulePermissions.Create] }),
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
        })
      )
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
