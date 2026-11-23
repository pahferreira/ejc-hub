import { describe, expect, it } from 'vitest'
import type {
  ScheduleActivity,
  ScheduleActivityStatus,
} from '../../services/schedule/schedule.types'
import {
  activityControls,
  doneActivityCount,
  nextPlannedActivity,
  runningActivity,
} from './scheduleLive'

function activity(
  id: string,
  status: ScheduleActivityStatus,
  overrides: Partial<ScheduleActivity> = {}
): ScheduleActivity {
  return {
    id,
    title: id,
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
  }
}

describe('activityControls', () => {
  it('offers Iniciar on the next planned activity to an admin', () => {
    expect(activityControls(activity('a2', 'planned'), 'a2', true)).toEqual({
      start: true,
      finish: false,
    })
  })

  it('offers no Iniciar on a planned activity that is not the next one', () => {
    expect(activityControls(activity('a3', 'planned'), 'a2', true)).toEqual({
      start: false,
      finish: false,
    })
  })

  it('offers Concluir on the running activity to an admin', () => {
    expect(activityControls(activity('a1', 'running'), 'a2', true)).toEqual({
      start: false,
      finish: true,
    })
  })

  it.each(['done', 'skipped'] as const)('offers nothing on a %s activity', (status) => {
    expect(activityControls(activity('a1', status), 'a1', true)).toEqual({
      start: false,
      finish: false,
    })
  })

  it.each([
    ['the next planned activity', activity('a2', 'planned')],
    ['the running activity', activity('a1', 'running')],
  ])('offers nothing on %s to someone who cannot control the clock', (_label, subject) => {
    expect(activityControls(subject, 'a2', false)).toEqual({ start: false, finish: false })
  })

  it('offers no Iniciar when the day has nothing left to start', () => {
    expect(activityControls(activity('a1', 'planned'), null, true).start).toBe(false)
  })
})

describe('runningActivity', () => {
  it('finds the running activity', () => {
    const activities = [
      activity('a1', 'done'),
      activity('a2', 'running'),
      activity('a3', 'planned'),
    ]

    expect(runningActivity(activities)?.id).toBe('a2')
  })

  it('is null when nothing runs', () => {
    expect(runningActivity([activity('a1', 'done'), activity('a2', 'planned')])).toBeNull()
  })
})

describe('nextPlannedActivity', () => {
  it('is the first planned activity, past done and skipped ones', () => {
    const activities = [
      activity('a1', 'done'),
      activity('a2', 'skipped'),
      activity('a3', 'planned'),
      activity('a4', 'planned'),
    ]

    expect(nextPlannedActivity(activities)?.id).toBe('a3')
  })

  it('is null once nothing is planned', () => {
    expect(nextPlannedActivity([activity('a1', 'done'), activity('a2', 'running')])).toBeNull()
  })
})

describe('doneActivityCount', () => {
  it('counts done activities only', () => {
    const activities = [
      activity('a1', 'done'),
      activity('a2', 'done'),
      activity('a3', 'skipped'),
      activity('a4', 'running'),
      activity('a5', 'planned'),
    ]

    expect(doneActivityCount(activities)).toBe(2)
  })

  it('is zero for a day that has not started', () => {
    expect(doneActivityCount([activity('a1', 'planned')])).toBe(0)
  })
})
