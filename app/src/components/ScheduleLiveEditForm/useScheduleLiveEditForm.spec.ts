import { describe, expect, it } from 'vitest'
import type {
  ScheduleActivity,
  ScheduleActivityStatus,
  ScheduleDay,
} from '../../services/schedule/schedule.types'
import { resyncLiveEdit } from './useScheduleLiveEditForm'

function activity(status: ScheduleActivityStatus, overrides: Partial<ScheduleActivity> = {}) {
  return {
    id: 'a1',
    title: 'Palestra',
    plannedStartsAt: '2026-04-03T21:00:00Z',
    durationMinutes: 30,
    place: 'Salão',
    guestName: null,
    adminsResponsible: true,
    allTeams: false,
    teams: [],
    status,
    actualStartedAt: null,
    actualEndedAt: null,
    adjustedDurationMinutes: null,
    effectiveDurationMinutes: 30,
    ...overrides,
  } satisfies ScheduleActivity
}

function days(...activities: ScheduleActivity[]): ScheduleDay[] {
  return [{ id: 'day-fri', date: '2026-04-03', activityCount: activities.length, activities }]
}

const TYPED = { adjustedDuration: '20', startTime: '', endTime: '' }

describe('resyncLiveEdit', () => {
  it('follows the activity into its new status, starting the values from it', () => {
    // Opened while planned; another admin started it at 18:02.
    const started = activity('running', { actualStartedAt: '2026-04-03T21:02:00Z' })

    expect(resyncLiveEdit(days(started), activity('planned'), TYPED)).toEqual({
      kind: 'reopen',
      activity: started,
      values: { adjustedDuration: '', startTime: '18:02', endTime: '' },
    })
  })

  it("keeps the admin's values when the status is the same", () => {
    const fresh = activity('planned')

    expect(resyncLiveEdit(days(fresh), activity('planned'), TYPED)).toEqual({
      kind: 'reopen',
      activity: fresh,
      values: TYPED,
    })
  })

  it('closes when the activity was skipped: nothing left to correct', () => {
    expect(resyncLiveEdit(days(activity('skipped')), activity('planned'), TYPED)).toEqual({
      kind: 'close',
    })
  })

  it('closes when the activity is gone', () => {
    expect(resyncLiveEdit(days(), activity('planned'), TYPED)).toEqual({ kind: 'close' })
    expect(resyncLiveEdit(undefined, activity('planned'), TYPED)).toEqual({ kind: 'close' })
  })
})
