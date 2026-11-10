import { describe, it, expect } from 'vitest'
import {
  defaultDayTab,
  groupActivitiesByPeriod,
  isMyTeamActivity,
  scheduleViewerRole,
} from './scheduleTimeline'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'

function activity(id: string, plannedStartsAt: string): ScheduleActivity {
  return {
    id,
    title: 'Atividade',
    plannedStartsAt,
    durationMinutes: 30,
    place: 'Salão',
    guestName: null,
    adminsResponsible: false,
    teams: [],
  }
}

const DAYS = [
  { id: 'day-fri', date: '2026-04-03' },
  { id: 'day-sat', date: '2026-04-04' },
  { id: 'day-sun', date: '2026-04-05' },
]

describe('defaultDayTab', () => {
  it("opens on today's day during the event", () => {
    // 10:00 São Paulo on Saturday.
    expect(defaultDayTab(DAYS, new Date('2026-04-04T13:00:00Z'))).toBe('day-sat')
  })

  it('reads today on the São Paulo clock, not UTC', () => {
    // 22:30 São Paulo on Saturday is already Sunday in UTC.
    expect(defaultDayTab(DAYS, new Date('2026-04-05T01:30:00Z'))).toBe('day-sat')
  })

  it('opens on the first day before the event', () => {
    expect(defaultDayTab(DAYS, new Date('2026-03-20T12:00:00Z'))).toBe('day-fri')
  })

  it('opens on the first day after the event', () => {
    expect(defaultDayTab(DAYS, new Date('2026-04-10T12:00:00Z'))).toBe('day-fri')
  })

  it('opens on the first day when today has no day planned', () => {
    const days = [DAYS[0], DAYS[2]]

    expect(defaultDayTab(days, new Date('2026-04-04T13:00:00Z'))).toBe('day-fri')
  })

  it('has no tab when no days are planned', () => {
    expect(defaultDayTab([], new Date('2026-04-04T13:00:00Z'))).toBeNull()
  })
})

// São Paulo is UTC-3: 06:00 there is 09:00Z.
describe('groupActivitiesByPeriod', () => {
  const FRIDAY = '2026-04-03'
  const ids = (groups: ReturnType<typeof groupActivitiesByPeriod>) =>
    groups.map((group) => [group.label, group.activities.map((item) => item.id)])

  it('splits the day into Manhã, Tarde and Noite by São Paulo start, keeping the order', () => {
    const groups = groupActivitiesByPeriod(
      [
        activity('06h', '2026-04-03T09:00:00Z'),
        activity('11h59', '2026-04-03T14:59:00Z'),
        activity('12h', '2026-04-03T15:00:00Z'),
        activity('17h59', '2026-04-03T20:59:00Z'),
        activity('18h', '2026-04-03T21:00:00Z'),
        activity('23h', '2026-04-04T02:00:00Z'),
      ],
      FRIDAY
    )

    expect(ids(groups)).toEqual([
      ['Manhã', ['06h', '11h59']],
      ['Tarde', ['12h', '17h59']],
      ['Noite', ['18h', '23h']],
    ])
  })

  it("keeps an activity past midnight in its day's Noite", () => {
    const groups = groupActivitiesByPeriod(
      [activity('22h', '2026-04-04T01:00:00Z'), activity('00h30', '2026-04-04T03:30:00Z')],
      FRIDAY
    )

    expect(ids(groups)).toEqual([['Noite', ['22h', '00h30']]])
  })

  it('leaves out the periods with no activities', () => {
    const groups = groupActivitiesByPeriod([activity('14h', '2026-04-03T17:00:00Z')], FRIDAY)

    expect(ids(groups)).toEqual([['Tarde', ['14h']]])
  })

  it('has no groups for an empty day', () => {
    expect(groupActivitiesByPeriod([], FRIDAY)).toEqual([])
  })
})

describe('isMyTeamActivity', () => {
  const team = (teamInstanceId: string) => ({
    teamInstanceId,
    teamName: teamInstanceId,
    teamKey: teamInstanceId,
    colorToken: 'rose',
  })
  const shared = {
    ...activity('shared', '2026-04-03T21:00:00Z'),
    teams: [team('team-cozinha'), team('team-liturgia')],
  }

  it("is the user's team's when their team is among those responsible", () => {
    expect(isMyTeamActivity(shared, 'team-liturgia')).toBe(true)
  })

  it("is not the user's team's when only other teams are responsible", () => {
    expect(isMyTeamActivity(shared, 'team-musica')).toBe(false)
  })

  it('is never the team of a user on no team', () => {
    expect(isMyTeamActivity(shared, null)).toBe(false)
  })
})

describe('scheduleViewerRole', () => {
  it('is coordinator for a coordinator, admin or not', () => {
    expect(scheduleViewerRole('coordinator')).toBe('coordinator')
  })

  it('is member for a member, admin or not', () => {
    expect(scheduleViewerRole('member')).toBe('member')
  })

  it('is admin for someone on no team', () => {
    expect(scheduleViewerRole(null)).toBe('admin')
  })
})
