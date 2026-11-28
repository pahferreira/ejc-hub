import { describe, expect, it } from 'vitest'
import type {
  ScheduleActivity,
  ScheduleActivityStatus,
} from '../../services/schedule/schedule.types'
import {
  activityControls,
  doneActivityCount,
  forecastSchedule,
  forecastScheduleDay,
  nextPlannedActivity,
  runningActivity,
  teamNextActivity,
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
    notes: [],
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

describe('forecastScheduleDay', () => {
  // 18:00, 18:30 and 19:00 in São Paulo, 30 minutes each.
  const day = (first: ScheduleActivity) => ({
    activities: [
      first,
      activity('a2', 'planned', { plannedStartsAt: '2026-04-03T21:30:00Z' }),
      activity('a3', 'planned', { plannedStartsAt: '2026-04-03T22:00:00Z' }),
    ],
  })

  it('pushes the remaining activities by a running overrun as now advances', () => {
    const running = activity('a1', 'running', { actualStartedAt: '2026-04-03T21:05:00Z' })
    const forecast = forecastScheduleDay(day(running), new Date('2026-04-03T21:45:00Z'))

    expect(forecast.driftMinutes).toBe(15)
    expect(forecast.byActivityId.get('a2')?.forecastStartsAt).toEqual(
      new Date('2026-04-03T21:45:00Z')
    )
    expect(forecast.byActivityId.get('a3')?.forecastStartsAt).toEqual(
      new Date('2026-04-03T22:15:00Z')
    )
  })

  it('pulls the remaining activities earlier after an early finish', () => {
    const done = activity('a1', 'done', {
      actualStartedAt: '2026-04-03T21:00:00Z',
      actualEndedAt: '2026-04-03T21:20:00Z',
    })
    const forecast = forecastScheduleDay(day(done), new Date('2026-04-03T21:20:00Z'))

    expect(forecast.driftMinutes).toBe(-10)
    expect(forecast.byActivityId.get('a2')?.forecastStartsAt).toEqual(
      new Date('2026-04-03T21:20:00Z')
    )
  })

  it('keeps a day that has not started on time', () => {
    const forecast = forecastScheduleDay(
      day(activity('a1', 'planned')),
      new Date('2026-04-03T12:00:00Z')
    )

    expect(forecast.driftMinutes).toBe(0)
    expect(forecast.byActivityId.get('a1')?.forecastStartsAt).toEqual(
      new Date('2026-04-03T21:00:00Z')
    )
  })
})

describe('teamNextActivity', () => {
  const team = (teamInstanceId: string) => [
    { teamInstanceId, teamName: teamInstanceId, teamKey: teamInstanceId, colorToken: 'violet' },
  ]
  const activities = [
    activity('a1', 'done', { teams: team('t-mine') }),
    activity('a2', 'planned', { teams: team('t-other') }),
    activity('a3', 'planned', { teams: team('t-mine') }),
    activity('a4', 'planned', { teams: team('t-mine') }),
  ]

  it("is the team's first planned activity from the Próxima one on", () => {
    expect(teamNextActivity(activities, activities[1], 't-mine')?.id).toBe('a3')
  })

  it("counts an activity for every team as the team's", () => {
    const withAllTeams = [
      activities[1],
      activity('a5', 'planned', { allTeams: true }),
      activities[2],
    ]
    expect(teamNextActivity(withAllTeams, activities[1], 't-mine')?.id).toBe('a5')
  })

  it("is null when the Próxima one is already the team's", () => {
    expect(teamNextActivity(activities, activities[2], 't-mine')).toBeNull()
  })

  it('is null when the viewer has no team', () => {
    expect(teamNextActivity(activities, activities[1], null)).toBeNull()
  })

  it('is null when the team has nothing left', () => {
    expect(teamNextActivity(activities, activities[1], 't-none')).toBeNull()
  })

  it('is null when nothing is next', () => {
    expect(teamNextActivity(activities, null, 't-mine')).toBeNull()
  })
})

describe('forecastSchedule', () => {
  const friday = {
    id: 'day-fri',
    activities: [
      activity('a1', 'running', { actualStartedAt: '2026-04-03T21:10:00Z' }),
      activity('a2', 'planned', { plannedStartsAt: '2026-04-03T21:30:00Z' }),
    ],
  }
  const saturday = {
    id: 'day-sat',
    activities: [activity('b1', 'planned', { plannedStartsAt: '2026-04-04T12:00:00Z' })],
  }

  it("forecasts every day's activities, resetting the drift each day", () => {
    const forecast = forecastSchedule([friday, saturday], new Date('2026-04-03T21:20:00Z'))

    expect(forecast.driftMinutesByDayId.get('day-fri')).toBe(10)
    expect(forecast.driftMinutesByDayId.get('day-sat')).toBe(0)
    expect(forecast.byActivityId.get('a2')?.forecastStartsAt).toEqual(
      new Date('2026-04-03T21:40:00Z')
    )
    expect(forecast.byActivityId.get('b1')?.forecastStartsAt).toEqual(
      new Date('2026-04-04T12:00:00Z')
    )
  })

  it('is empty without days', () => {
    const forecast = forecastSchedule([], new Date('2026-04-03T21:20:00Z'))

    expect(forecast.byActivityId.size).toBe(0)
    expect(forecast.driftMinutesByDayId.size).toBe(0)
  })
})
