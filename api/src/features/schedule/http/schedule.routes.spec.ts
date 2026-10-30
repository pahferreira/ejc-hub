import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The application layer is mocked so the routes never reach the database.
const scheduleApp = vi.hoisted(() => ({
  getSchedule: vi.fn(),
  createDay: vi.fn(),
  deleteDay: vi.fn(),
}))

vi.mock('../application/schedule-app.ts', () => ({ scheduleApp }))

import { scheduleRoutes } from './schedule.routes.ts'
import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { SchedulePermissions } from '../../../../../common/permissions/permissions.types.ts'
import type { FastifyServerInstance } from '../../../shared/fastify.types.ts'
import { authHeader, buildRouteTestServer } from '../../../shared/testing/route-test-server.ts'

const DAY_ID = '7f0c2a52-8d2e-4c7b-9f43-1d1f3f0c9a11'

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
    scheduleApp.deleteDay.mockResolvedValue({ dayId: DAY_ID })

    server = await buildRouteTestServer(scheduleRoutes)
  })

  afterEach(async () => {
    await server.close()
    vi.clearAllMocks()
  })

  describe('authentication', () => {
    it.each([
      ['GET', '/schedule'],
      ['POST', '/schedule/days'],
      ['DELETE', `/schedule/days/${DAY_ID}`],
    ] as const)('answers %s %s with 401 without a token', async (method, url) => {
      const response = await server.inject({ method, url, payload: { date: '2026-04-03' } })

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
