import { describe, it, expect } from 'vitest'
import { selectedScheduleDay } from './useSelectedScheduleDay'
import type { ScheduleDay } from '../../services/schedule/schedule.types'

const day = (id: string, date: string): ScheduleDay => ({
  id,
  date,
  activityCount: 0,
  activities: [],
})

const DAYS = [day('day-fri', '2026-04-03'), day('day-sat', '2026-04-04')]
// 10:00 São Paulo on Saturday.
const SATURDAY = new Date('2026-04-04T13:00:00Z')

describe('selectedScheduleDay', () => {
  it('is the picked day', () => {
    expect(selectedScheduleDay(DAYS, 'day-fri', SATURDAY)?.id).toBe('day-fri')
  })

  it("falls back to the default day (today's) while none is picked", () => {
    expect(selectedScheduleDay(DAYS, null, SATURDAY)?.id).toBe('day-sat')
  })

  it('falls back to the default day when the picked one is gone', () => {
    expect(selectedScheduleDay(DAYS, 'day-deleted', SATURDAY)?.id).toBe('day-sat')
  })

  it('is undefined when no days are planned', () => {
    expect(selectedScheduleDay([], null, SATURDAY)).toBeUndefined()
  })
})
