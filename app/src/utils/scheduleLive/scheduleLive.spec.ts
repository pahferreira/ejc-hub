import { describe, expect, it } from 'vitest'
import type {
  ScheduleActivity,
  ScheduleActivityStatus,
} from '../../services/schedule/schedule.types'
import type { ActivityControlContext } from './scheduleLive'
import {
  activityControls,
  canUndoSkip,
  doneActivityCount,
  nextPlannedActivity,
  reopenableActivity,
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
  const NONE = {
    start: false,
    finish: false,
    skip: false,
    undoStart: false,
    reopen: false,
    undoSkip: false,
  }

  function context(overrides: Partial<ActivityControlContext> = {}): ActivityControlContext {
    return { nextPlannedId: 'a2', reopenableId: null, dayActivities: [], ...overrides }
  }

  it('offers Iniciar and Pular on the next planned activity to an admin', () => {
    expect(activityControls(activity('a2', 'planned'), context(), true)).toEqual({
      ...NONE,
      start: true,
      skip: true,
    })
  })

  it('offers Pular but no Iniciar on a planned activity that is not the next one', () => {
    expect(activityControls(activity('a3', 'planned'), context(), true)).toEqual({
      ...NONE,
      skip: true,
    })
  })

  it('offers Concluir and Desfazer início on the running activity to an admin', () => {
    expect(activityControls(activity('a1', 'running'), context(), true)).toEqual({
      ...NONE,
      finish: true,
      undoStart: true,
    })
  })

  it('offers Reabrir on the reopenable done activity', () => {
    expect(activityControls(activity('a1', 'done'), context({ reopenableId: 'a1' }), true)).toEqual(
      { ...NONE, reopen: true }
    )
  })

  it('offers nothing on a done activity that cannot reopen', () => {
    expect(activityControls(activity('a1', 'done'), context({ reopenableId: 'a0' }), true)).toEqual(
      NONE
    )
  })

  it('offers Desfazer on a skipped activity while nothing later on the day has started', () => {
    const skipped = activity('a1', 'skipped')
    const dayActivities = [skipped, activity('a2', 'skipped'), activity('a3', 'planned')]

    expect(activityControls(skipped, context({ dayActivities }), true)).toEqual({
      ...NONE,
      undoSkip: true,
    })
  })

  it('offers nothing on a skipped activity once a later one has started', () => {
    const skipped = activity('a1', 'skipped')
    const dayActivities = [skipped, activity('a2', 'running')]

    expect(activityControls(skipped, context({ dayActivities }), true)).toEqual(NONE)
  })

  it.each([
    ['the next planned activity', activity('a2', 'planned')],
    ['the running activity', activity('a1', 'running')],
    ['the reopenable done activity', activity('a0', 'done')],
    ['an undoable skipped activity', activity('a3', 'skipped')],
  ])('offers nothing on %s to someone who cannot control the clock', (_label, subject) => {
    const dayActivities = [subject]

    expect(
      activityControls(subject, context({ reopenableId: 'a0', dayActivities }), false)
    ).toEqual(NONE)
  })

  it('offers no Iniciar when the day has nothing left to start', () => {
    expect(
      activityControls(activity('a1', 'planned'), context({ nextPlannedId: null }), true).start
    ).toBe(false)
  })
})

describe('canUndoSkip', () => {
  it('allows it while every later activity of the day is planned or skipped', () => {
    const skipped = activity('a2', 'skipped')
    const day = [
      activity('a1', 'done'),
      skipped,
      activity('a3', 'skipped'),
      activity('a4', 'planned'),
    ]

    expect(canUndoSkip(skipped, day)).toBe(true)
  })

  it.each(['running', 'done'] as const)('refuses it once a later activity is %s', (status) => {
    const skipped = activity('a1', 'skipped')

    expect(canUndoSkip(skipped, [skipped, activity('a2', status)])).toBe(false)
  })

  it('refuses it for an activity that is not skipped', () => {
    const planned = activity('a1', 'planned')

    expect(canUndoSkip(planned, [planned])).toBe(false)
  })
})

describe('reopenableActivity', () => {
  it('is the most recently finished activity, whatever the planned order', () => {
    const activities = [
      activity('a1', 'done', { actualEndedAt: '2026-04-03T21:40:00Z' }),
      activity('a2', 'done', { actualEndedAt: '2026-04-03T21:30:00Z' }),
      activity('a3', 'planned'),
    ]

    expect(reopenableActivity(activities)?.id).toBe('a1')
  })

  it('is null while an activity runs', () => {
    const activities = [
      activity('a1', 'done', { actualEndedAt: '2026-04-03T21:30:00Z' }),
      activity('a2', 'running'),
    ]

    expect(reopenableActivity(activities)).toBeNull()
  })

  it('is null when nothing has finished', () => {
    expect(reopenableActivity([activity('a1', 'skipped'), activity('a2', 'planned')])).toBeNull()
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
