import { describe, it, expect } from 'vitest'
import {
  activityEndTime,
  activityStartTime,
  buildActivityBody,
  endTimeLabel,
  formatDaySummary,
  formatDuration,
  suggestedNextStart,
  summarizeDay,
} from './scheduleActivity'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'

// 18:00 São Paulo on Friday 03 April 2026 (UTC-3).
const FRI_18H = '2026-04-03T21:00:00Z'

function activity(overrides: Partial<ScheduleActivity> = {}): ScheduleActivity {
  return {
    id: 'activity-1',
    title: 'Acolhida',
    plannedStartsAt: FRI_18H,
    durationMinutes: 30,
    place: 'Salão',
    guestName: null,
    adminsResponsible: false,
    teams: [],
    ...overrides,
  }
}

describe('activityStartTime / activityEndTime', () => {
  it('shows the start and end on the São Paulo clock', () => {
    const card = activity({ plannedStartsAt: FRI_18H, durationMinutes: 30 })

    expect(activityStartTime(card)).toBe('18:00')
    expect(activityEndTime(card)).toBe('18:30')
  })

  it('reads an end that crosses midnight on the next day clock', () => {
    const card = activity({ plannedStartsAt: '2026-04-04T02:00:00Z', durationMinutes: 90 })

    // Starts 23:00, ends 00:30.
    expect(activityStartTime(card)).toBe('23:00')
    expect(activityEndTime(card)).toBe('00:30')
  })
})

describe('endTimeLabel', () => {
  it.each([
    ['18:00', 30, '18:30'],
    ['18:00', 60, '19:00'],
    ['23:00', 90, '00:30'],
    ['23:45', 30, '00:15'],
  ])('adds %s + %i min = %s', (start, duration, expected) => {
    expect(endTimeLabel(start, duration)).toBe(expected)
  })

  it('is empty for a malformed start', () => {
    expect(endTimeLabel('', 30)).toBe('')
    expect(endTimeLabel('8h', 30)).toBe('')
  })
})

describe('formatDuration', () => {
  it.each([
    [30, '30 min'],
    [45, '45 min'],
    [60, '1h'],
    [75, '1h15'],
    [65, '1h05'],
    [120, '2h'],
    [150, '2h30'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected)
  })
})

describe('summarizeDay / formatDaySummary', () => {
  it('is null for an empty day', () => {
    expect(summarizeDay([], '2026-04-03')).toBeNull()
  })

  it('summarizes a single activity', () => {
    const summary = summarizeDay([activity()], '2026-04-03')

    expect(summary).toEqual({
      firstStart: '18:00',
      lastEnd: '18:30',
      nextDay: false,
      count: 1,
    })
    expect(formatDaySummary(summary!)).toBe('Das 18:00 às 18:30 · 1 atividade')
  })

  it('flags a last activity that crosses midnight and counts in the plural', () => {
    const activities = [
      activity({ id: 'a1', plannedStartsAt: '2026-04-03T10:00:00Z', durationMinutes: 30 }), // 07:00
      activity({ id: 'a2', plannedStartsAt: '2026-04-04T02:30:00Z', durationMinutes: 120 }), // 23:30 → 01:30... use below
    ]

    const summary = summarizeDay(activities, '2026-04-03')

    expect(summary?.firstStart).toBe('07:00')
    expect(summary?.nextDay).toBe(true)
    expect(summary?.count).toBe(2)
    expect(formatDaySummary(summary!)).toContain('(dia seguinte)')
    expect(formatDaySummary(summary!)).toContain('· 2 atividades')
  })

  it('takes the latest end, not the last start', () => {
    const activities = [
      activity({ id: 'long', plannedStartsAt: '2026-04-03T21:00:00Z', durationMinutes: 120 }), // 18:00 → 20:00
      activity({ id: 'short', plannedStartsAt: '2026-04-03T22:00:00Z', durationMinutes: 15 }), // 19:00 → 19:15
    ]

    expect(summarizeDay(activities, '2026-04-03')?.lastEnd).toBe('20:00')
  })
})

describe('suggestedNextStart', () => {
  it('defaults to 08:00 for an empty day', () => {
    expect(suggestedNextStart([])).toBe('08:00')
  })

  it('suggests the end of the last activity', () => {
    expect(suggestedNextStart([activity({ plannedStartsAt: FRI_18H, durationMinutes: 30 })])).toBe(
      '18:30'
    )
  })
})

describe('buildActivityBody', () => {
  it('builds the body, turning the HH:mm start into an ISO instant in São Paulo', () => {
    const body = buildActivityBody('day-fri', '2026-04-03', {
      title: '  Acolhida  ',
      startTime: '18:00',
      durationMinutes: 30,
      place: '  Salão  ',
      teamInstanceIds: ['team-a'],
      guestName: '  ',
      adminsResponsible: true,
    })

    expect(body).toEqual({
      dayId: 'day-fri',
      title: 'Acolhida',
      plannedStartsAt: '2026-04-03T21:00:00.000Z',
      durationMinutes: 30,
      place: 'Salão',
      teamInstanceIds: ['team-a'],
      guestName: null,
      adminsResponsible: true,
    })
  })

  it('keeps a trimmed guest name', () => {
    const body = buildActivityBody('day-fri', '2026-04-03', {
      title: 'Palestra',
      startTime: '20:00',
      durationMinutes: 60,
      place: 'Auditório',
      teamInstanceIds: [],
      guestName: '  Padre João  ',
      adminsResponsible: false,
    })

    expect(body.guestName).toBe('Padre João')
  })
})
