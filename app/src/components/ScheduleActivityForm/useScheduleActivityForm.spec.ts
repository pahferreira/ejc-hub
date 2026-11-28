import { describe, it, expect } from 'vitest'
import { withLockedPlan } from './useScheduleActivityForm'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import type { ScheduleActivityFormValues } from '../../utils/scheduleActivity/scheduleActivity'

// 18:00 São Paulo on Friday 03 April 2026 (UTC-3), for 30 minutes.
function activity(overrides: Partial<ScheduleActivity> = {}): ScheduleActivity {
  return {
    id: 'activity-1',
    title: 'Acolhida',
    plannedStartsAt: '2026-04-03T21:00:00Z',
    durationMinutes: 30,
    place: 'Salão',
    guestName: null,
    adminsResponsible: true,
    allTeams: false,
    teams: [],
    status: 'planned',
    actualStartedAt: null,
    actualEndedAt: null,
    adjustedDurationMinutes: null,
    effectiveDurationMinutes: 30,
    ...overrides,
  }
}

// What the admin typed while the activity was still planned.
const TYPED: ScheduleActivityFormValues = {
  title: 'Acolhida das famílias',
  startTime: '18:15',
  durationMinutes: 45,
  place: 'Capela',
  teamInstanceIds: [],
  guestName: '',
  adminsResponsible: true,
  allTeams: false,
}

describe('withLockedPlan', () => {
  it('keeps every typed value while the activity is planned', () => {
    expect(withLockedPlan(TYPED, activity())).toEqual(TYPED)
  })

  it('keeps every typed value for a new activity', () => {
    expect(withLockedPlan(TYPED, undefined)).toEqual(TYPED)
  })

  it.each(['running', 'done', 'skipped'] as const)(
    'puts a %s activity back to its stored start and duration, keeping the other fields',
    (status) => {
      expect(withLockedPlan(TYPED, activity({ status }))).toEqual({
        ...TYPED,
        startTime: '18:00',
        durationMinutes: 30,
      })
    }
  )
})
