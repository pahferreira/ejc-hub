import { describe, it, expect, vi } from 'vitest'
import { Attendance } from './Attendance.ts'
import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { MeetingRepository } from '../../../modules/meeting/domain/MeetingRepository.ts'
import type { MeetingAttendanceRepository } from '../../../modules/meeting-attendance/domain/MeetingAttendanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import type { TeamRosterMember } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { MeetingAttendanceRow } from '../../../modules/meeting-attendance/domain/MeetingAttendanceRepository.ts'
import type { MeetingAttendanceStatus } from '../../../modules/meeting-attendance/domain/meeting-attendance-status.ts'

const EVENT_ID = 'event-1'
const TEAM_A = 'team-a'
const ACTOR_AUTH_ID = 'auth0|coord'
const ACTOR_ID = 'coord-1'

const JOINED_EARLY = new Date('2026-10-01T12:00:00Z')

type MeetingFixture = {
  id: string
  heldOn: string
  title?: string | null
  description?: string | null
  createdAt?: Date
  updatedAt?: Date
}

function buildMeeting(fixture: MeetingFixture) {
  const createdAt = fixture.createdAt ?? new Date('2026-10-05T10:00:00Z')
  return {
    id: fixture.id,
    teamInstanceId: TEAM_A,
    heldOn: fixture.heldOn,
    title: fixture.title ?? null,
    description: fixture.description ?? null,
    createdBy: ACTOR_ID,
    createdAt,
    updatedAt: fixture.updatedAt ?? createdAt,
  }
}

function buildRoster(
  overrides: Partial<TeamRosterMember> & Pick<TeamRosterMember, 'userId' | 'name'>
): TeamRosterMember {
  return {
    nickname: null,
    pictureUrl: null,
    type: 'member',
    joinedAt: JOINED_EARLY,
    ...overrides,
  }
}

function buildRow(
  meetingId: string,
  heldOn: string,
  userId: string,
  status: MeetingAttendanceStatus,
  justificationReason: string | null = null
): MeetingAttendanceRow {
  return {
    id: `${meetingId}-${userId}`,
    meetingId,
    heldOn,
    userId,
    name: userId,
    nickname: null,
    pictureUrl: null,
    status,
    justificationReason,
  }
}

type Scenario = {
  currentEvent?: unknown
  actor?: unknown
  actorMembership?: { id: string; teamInstanceId: string; type: 'member' | 'coordinator' }
  roster?: TeamRosterMember[]
  meetings?: ReturnType<typeof buildMeeting>[]
  attendanceRows?: MeetingAttendanceRow[]
}

function makeAttendance(scenario: Scenario = {}) {
  const eventRepository = {
    findCurrentEvent: vi
      .fn()
      .mockResolvedValue('currentEvent' in scenario ? scenario.currentEvent : { id: EVENT_ID }),
  } as unknown as EventRepository

  const userRepository = {
    getUser: vi
      .fn()
      .mockResolvedValue('actor' in scenario ? scenario.actor : { id: ACTOR_ID, name: 'Coord' }),
  } as unknown as UserRepository

  const listRosterByTeamInstance = vi.fn().mockResolvedValue(scenario.roster ?? [])
  const teamMembershipRepository = {
    findMembershipByUserAndEvent: vi
      .fn()
      .mockResolvedValue(
        'actorMembership' in scenario
          ? scenario.actorMembership
          : { id: 'm-1', teamInstanceId: TEAM_A, type: 'coordinator' }
      ),
    listRosterByTeamInstance,
  } as unknown as TeamMembershipRepository

  const meetingRepository = {
    listMeetingsByTeamInstance: vi.fn().mockResolvedValue(scenario.meetings ?? []),
  } as unknown as MeetingRepository

  const meetingAttendanceRepository = {
    listAttendancesByTeamInstance: vi.fn().mockResolvedValue(scenario.attendanceRows ?? []),
  } as unknown as MeetingAttendanceRepository

  return {
    attendance: new Attendance(
      eventRepository,
      userRepository,
      teamMembershipRepository,
      meetingRepository,
      meetingAttendanceRepository
    ),
    listRosterByTeamInstance,
  }
}

describe('Attendance.getMyTeamReadModel authorization', () => {
  it('rejects a caller with no membership in the current event', async () => {
    const { attendance } = makeAttendance({ actorMembership: undefined })

    const error = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID).catch((e: AppError) => e)

    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).getAppErrorCode()).toBe(AppErrorCode.Forbidden)
  })

  it('rejects a caller who is only a member, not a coordinator', async () => {
    const { attendance } = makeAttendance({
      actorMembership: { id: 'm-2', teamInstanceId: TEAM_A, type: 'member' },
    })

    const error = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID).catch((e: AppError) => e)

    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).getAppErrorCode()).toBe(AppErrorCode.Forbidden)
  })

  it("only ever reads the caller's own team, derived from their membership", async () => {
    const { attendance, listRosterByTeamInstance } = makeAttendance()

    await attendance.getMyTeamReadModel(ACTOR_AUTH_ID)

    expect(listRosterByTeamInstance).toHaveBeenCalledWith(TEAM_A)
  })

  it('throws when there is no current event', async () => {
    const { attendance } = makeAttendance({ currentEvent: undefined })

    await expect(attendance.getMyTeamReadModel(ACTOR_AUTH_ID)).rejects.toBeInstanceOf(AppError)
  })

  it('throws when the caller resolves to no user', async () => {
    const { attendance } = makeAttendance({ actor: undefined })

    await expect(attendance.getMyTeamReadModel(ACTOR_AUTH_ID)).rejects.toBeInstanceOf(AppError)
  })
})

describe('Attendance.getMyTeamReadModel read model', () => {
  const JOINED_MID = new Date('2026-10-04T12:00:00Z')
  const JOINED_LATE = new Date('2026-10-10T12:00:00Z')

  const roster: TeamRosterMember[] = [
    buildRoster({ userId: 'good', name: 'Ana Boa', type: 'coordinator' }),
    buildRoster({ userId: 'risky', name: 'Bruno Risco' }),
    buildRoster({ userId: 'needs', name: 'Caio Substituir' }),
    buildRoster({ userId: 'few', name: 'Duda Nova', joinedAt: JOINED_MID }),
    buildRoster({ userId: 'none', name: 'Eva Recente', joinedAt: JOINED_LATE }),
  ]

  const meetings = [
    buildMeeting({ id: 'm4', heldOn: '2026-10-05', title: 'Ensaio geral' }),
    buildMeeting({ id: 'm3', heldOn: '2026-10-04' }),
    buildMeeting({
      id: 'm2',
      heldOn: '2026-10-03',
      createdAt: new Date('2026-10-03T10:00:00Z'),
      updatedAt: new Date('2026-10-06T10:00:00Z'),
    }),
    buildMeeting({ id: 'm1', heldOn: '2026-10-02' }),
  ]

  // A removed member ('ghost') keeps their rows but is absent from the roster.
  const attendanceRows: MeetingAttendanceRow[] = [
    buildRow('m1', '2026-10-02', 'good', 'present'),
    buildRow('m1', '2026-10-02', 'risky', 'present'),
    buildRow('m1', '2026-10-02', 'needs', 'absent'),
    buildRow('m1', '2026-10-02', 'ghost', 'present'),

    buildRow('m2', '2026-10-03', 'good', 'present'),
    buildRow('m2', '2026-10-03', 'risky', 'justified', 'trabalho'),
    buildRow('m2', '2026-10-03', 'needs', 'absent'),
    buildRow('m2', '2026-10-03', 'ghost', 'present'),

    buildRow('m3', '2026-10-04', 'good', 'present'),
    buildRow('m3', '2026-10-04', 'risky', 'absent'),
    buildRow('m3', '2026-10-04', 'needs', 'absent'),
    buildRow('m3', '2026-10-04', 'few', 'present'),
    buildRow('m3', '2026-10-04', 'ghost', 'present'),

    buildRow('m4', '2026-10-05', 'good', 'present'),
    buildRow('m4', '2026-10-05', 'risky', 'present'),
    buildRow('m4', '2026-10-05', 'needs', 'present'),
    buildRow('m4', '2026-10-05', 'few', 'present'),
    buildRow('m4', '2026-10-05', 'ghost', 'present'),
  ]

  it('pools the Média over every row, not the mean of the members percentages', async () => {
    const { attendance } = makeAttendance({ roster, meetings, attendanceRows })

    const model = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID)

    // 13 present, 1 justified, 4 absent -> 13 / 17 = 76%. The mean of the
    // members' own percentages (100, 67, 25, 100) is 73, a different number.
    expect(model.teamAverage).toEqual({
      present: 13,
      eligible: 17,
      justified: 1,
      percentage: 76,
      band: 'good',
    })
  })

  it('counts every roster member into exactly one band', async () => {
    const { attendance } = makeAttendance({ roster, meetings, attendanceRows })

    const model = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID)

    expect(model.bandCounts).toEqual({
      good: 1,
      risky: 1,
      'needs-replacement': 1,
      'insufficient-data': 1,
      'no-meetings': 1,
    })
  })

  it('reports the meeting count, the justified total and every row as the denominator', async () => {
    const { attendance } = makeAttendance({ roster, meetings, attendanceRows })

    const model = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID)

    expect(model.meetingCount).toBe(4)
    expect(model.justifiedTotal).toBe(1)
    expect(model.totalRows).toBe(18)
  })

  it('gives each roster member a pro-rated rate and keeps their join date', async () => {
    const { attendance } = makeAttendance({ roster, meetings, attendanceRows })

    const model = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID)
    const byId = new Map(model.roster.map((member) => [member.userId, member]))

    expect(byId.get('good')?.rate).toMatchObject({ percentage: 100, band: 'good' })
    expect(byId.get('risky')?.rate).toMatchObject({ band: 'risky' })
    expect(byId.get('needs')?.rate).toMatchObject({ percentage: 25, band: 'needs-replacement' })
    // Joined mid-event: only the two meetings since count, so a withheld band.
    expect(byId.get('few')?.rate).toMatchObject({ eligible: 2, band: 'insufficient-data' })
    expect(byId.get('few')?.joinedAt).toEqual(JOINED_MID)
    // Joined after the last meeting: no eligible meetings at all.
    expect(byId.get('none')?.rate).toMatchObject({ percentage: null, band: 'no-meetings' })
  })

  it("keeps a removed member's rows in the pooled numbers without putting them on the roster", async () => {
    const { attendance } = makeAttendance({ roster, meetings, attendanceRows })

    const model = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID)

    expect(model.roster.map((member) => member.userId)).not.toContain('ghost')
    // Five roster members, each banded once — the ghost's four present rows are
    // not among them, yet they lifted the pooled present count to 13 above.
    const banded = Object.values(model.bandCounts).reduce((sum, count) => sum + count, 0)
    expect(banded).toBe(roster.length)
  })

  it('flags an edited meeting and carries its rows and per-meeting rate', async () => {
    const { attendance } = makeAttendance({ roster, meetings, attendanceRows })

    const model = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID)
    const byId = new Map(model.meetings.map((meeting) => [meeting.id, meeting]))

    expect(byId.get('m2')?.edited).toBe(true)
    expect(byId.get('m4')?.edited).toBe(false)
    expect(byId.get('m4')?.rate).toMatchObject({ percentage: 100, band: 'good' })
    expect(byId.get('m2')?.attendances).toHaveLength(4)
    expect(
      byId.get('m2')?.attendances.find((entry) => entry.userId === 'risky')?.justificationReason
    ).toBe('trabalho')
  })

  it('lists meetings most recently held first, matching the repository order', async () => {
    const { attendance } = makeAttendance({ roster, meetings, attendanceRows })

    const model = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID)

    expect(model.meetings.map((meeting) => meeting.id)).toEqual(['m4', 'm3', 'm2', 'm1'])
  })
})

describe('Attendance.getMyTeamReadModel empty state', () => {
  it('reports no meetings and no-meetings bands when nothing has been registered', async () => {
    const { attendance } = makeAttendance({
      roster: [
        buildRoster({ userId: 'a', name: 'Ana' }),
        buildRoster({ userId: 'b', name: 'Bia' }),
      ],
      meetings: [],
      attendanceRows: [],
    })

    const model = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID)

    expect(model.meetingCount).toBe(0)
    expect(model.meetings).toEqual([])
    expect(model.totalRows).toBe(0)
    expect(model.teamAverage).toMatchObject({ percentage: null, band: 'no-meetings' })
    expect(model.bandCounts['no-meetings']).toBe(2)
  })
})
