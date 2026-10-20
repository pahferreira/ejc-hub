import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// runInTransaction is mocked to run the callback with a throwaway tx handle so
// the core logic can be unit-tested without a database.
vi.mock('../../../core/database/client.ts', () => ({
  runInTransaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
}))

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

  const insertMeeting = vi
    .fn()
    .mockImplementation((input: { heldOn: string }) =>
      Promise.resolve(buildMeeting({ id: 'new-meeting', heldOn: input.heldOn }))
    )
  const meetingRepository = {
    listMeetingsByTeamInstance: vi.fn().mockResolvedValue(scenario.meetings ?? []),
    insertMeeting,
  } as unknown as MeetingRepository

  const insertAttendances = vi
    .fn()
    .mockImplementation((inputs: unknown[]) =>
      Promise.resolve(inputs.map((_, index) => `row-${index}`))
    )
  const meetingAttendanceRepository = {
    listAttendancesByTeamInstance: vi.fn().mockResolvedValue(scenario.attendanceRows ?? []),
    insertAttendances,
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
    insertMeeting,
    insertAttendances,
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

describe('Attendance.getMyTeamReadModel roster order', () => {
  it('lists the roster by nickname like /my-team, then full name, then id', async () => {
    // The repository returns people by full name; the rows show the nickname first.
    const { attendance } = makeAttendance({
      roster: [
        buildRoster({ userId: 'u3', name: 'Ana Souza', nickname: 'Zeca' }),
        buildRoster({ userId: 'u2', name: 'Bruno Lima', nickname: 'Ju' }),
        buildRoster({ userId: 'u1', name: 'Carla Dias', nickname: null }),
        buildRoster({ userId: 'u4', name: 'Juliana Alves', nickname: 'Jú' }),
      ],
    })

    const model = await attendance.getMyTeamReadModel(ACTOR_AUTH_ID)

    // Carla falls back to her first name; "Ju" and "Jú" tie and break on the full name.
    expect(model.roster.map((member) => member.nickname)).toEqual(['Carla', 'Ju', 'Jú', 'Zeca'])
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

describe('Attendance.registerMeeting', () => {
  // Noon UTC is 09:00 in São Paulo, so "today" is the same day in both zones.
  const NOW = new Date('2026-10-20T12:00:00Z')

  const roster: TeamRosterMember[] = [
    buildRoster({ userId: 'coord', name: 'Ana Coord', type: 'coordinator' }),
    buildRoster({ userId: 'came', name: 'Bruno Veio' }),
    buildRoster({ userId: 'excused', name: 'Caio Justificou' }),
    buildRoster({ userId: 'missed', name: 'Duda Faltou' }),
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates the meeting on the caller team with one row per roster member, unticked as absent', async () => {
    const { attendance, insertMeeting, insertAttendances } = makeAttendance({ roster })

    const result = await attendance.registerMeeting(ACTOR_AUTH_ID, {
      heldOn: '2026-10-18',
      title: 'Ensaio geral',
      presentUserIds: ['coord', 'came'],
      justified: [{ userId: 'excused', reason: 'Trabalho' }],
    })

    expect(insertMeeting).toHaveBeenCalledWith(
      {
        teamInstanceId: TEAM_A,
        heldOn: '2026-10-18',
        title: 'Ensaio geral',
        description: null,
        createdBy: ACTOR_ID,
      },
      expect.anything()
    )
    expect(insertAttendances).toHaveBeenCalledWith(
      expect.arrayContaining([
        { meetingId: 'new-meeting', userId: 'coord', status: 'present', justificationReason: null },
        { meetingId: 'new-meeting', userId: 'came', status: 'present', justificationReason: null },
        {
          meetingId: 'new-meeting',
          userId: 'excused',
          status: 'justified',
          justificationReason: 'Trabalho',
        },
        { meetingId: 'new-meeting', userId: 'missed', status: 'absent', justificationReason: null },
      ]),
      expect.anything()
    )
    expect(insertAttendances.mock.calls[0][0]).toHaveLength(roster.length)
    expect(result).toEqual({ meetingId: 'new-meeting', attendeeCount: 2, justifiedCount: 1 })
  })
  async function rejection(promise: Promise<unknown>) {
    const error = await promise.catch((e: unknown) => e)
    expect(error).toBeInstanceOf(AppError)
    return error as AppError
  }

  it('rejects a date after today in São Paulo and writes nothing', async () => {
    const { attendance, insertMeeting, insertAttendances } = makeAttendance({ roster })

    await rejection(
      attendance.registerMeeting(ACTOR_AUTH_ID, {
        heldOn: '2026-10-21',
        presentUserIds: [],
        justified: [],
      })
    )

    expect(insertMeeting).not.toHaveBeenCalled()
    expect(insertAttendances).not.toHaveBeenCalled()
  })

  it('reads today as the São Paulo day, not the UTC one', async () => {
    // 01:00 UTC on the 21st is still 22:00 on the 20th in São Paulo.
    vi.setSystemTime(new Date('2026-10-21T01:00:00Z'))
    const { attendance } = makeAttendance({ roster })

    await rejection(
      attendance.registerMeeting(ACTOR_AUTH_ID, {
        heldOn: '2026-10-21',
        presentUserIds: [],
        justified: [],
      })
    )
    await expect(
      attendance.registerMeeting(ACTOR_AUTH_ID, {
        heldOn: '2026-10-20',
        presentUserIds: [],
        justified: [],
      })
    ).resolves.toMatchObject({ meetingId: 'new-meeting' })
  })
  it('rejects someone ticked present and justified at once', async () => {
    const { attendance, insertMeeting } = makeAttendance({ roster })

    await rejection(
      attendance.registerMeeting(ACTOR_AUTH_ID, {
        heldOn: '2026-10-18',
        presentUserIds: ['came'],
        justified: [{ userId: 'came', reason: 'Trabalho' }],
      })
    )

    expect(insertMeeting).not.toHaveBeenCalled()
  })

  it('rejects the same person justified twice', async () => {
    const { attendance } = makeAttendance({ roster })

    await rejection(
      attendance.registerMeeting(ACTOR_AUTH_ID, {
        heldOn: '2026-10-18',
        presentUserIds: [],
        justified: [
          { userId: 'excused', reason: 'Trabalho' },
          { userId: 'excused', reason: 'Viagem' },
        ],
      })
    )
  })

  it('rejects a present id that is not on the team roster', async () => {
    const { attendance, insertMeeting } = makeAttendance({ roster })

    await rejection(
      attendance.registerMeeting(ACTOR_AUTH_ID, {
        heldOn: '2026-10-18',
        presentUserIds: ['stranger'],
        justified: [],
      })
    )

    expect(insertMeeting).not.toHaveBeenCalled()
  })

  it('rejects a justified id that is not on the team roster', async () => {
    const { attendance } = makeAttendance({ roster })

    await rejection(
      attendance.registerMeeting(ACTOR_AUTH_ID, {
        heldOn: '2026-10-18',
        presentUserIds: [],
        justified: [{ userId: 'stranger', reason: 'Trabalho' }],
      })
    )
  })
  it.each(['', '   '])('rejects a justified absence whose reason is %j', async (reason) => {
    const { attendance, insertMeeting } = makeAttendance({ roster })

    await rejection(
      attendance.registerMeeting(ACTOR_AUTH_ID, {
        heldOn: '2026-10-18',
        presentUserIds: [],
        justified: [{ userId: 'excused', reason }],
      })
    )

    expect(insertMeeting).not.toHaveBeenCalled()
  })

  it('rejects a caller who is only a member, not a coordinator', async () => {
    const { attendance, insertMeeting } = makeAttendance({
      roster,
      actorMembership: { id: 'm-2', teamInstanceId: TEAM_A, type: 'member' },
    })

    const error = await rejection(
      attendance.registerMeeting(ACTOR_AUTH_ID, {
        heldOn: '2026-10-18',
        presentUserIds: [],
        justified: [],
      })
    )

    expect(error.getAppErrorCode()).toBe(AppErrorCode.Forbidden)
    expect(insertMeeting).not.toHaveBeenCalled()
  })

  it('allows a second meeting on a day that already has one', async () => {
    const { attendance, insertMeeting } = makeAttendance({
      roster,
      meetings: [buildMeeting({ id: 'earlier', heldOn: '2026-10-18' })],
    })

    await attendance.registerMeeting(ACTOR_AUTH_ID, {
      heldOn: '2026-10-18',
      presentUserIds: ['came'],
      justified: [],
    })

    expect(insertMeeting).toHaveBeenCalledOnce()
  })

  it('stores a blank title and description as null and trims the reason', async () => {
    const { attendance, insertMeeting, insertAttendances } = makeAttendance({ roster })

    await attendance.registerMeeting(ACTOR_AUTH_ID, {
      heldOn: '2026-10-18',
      title: '  ',
      description: '',
      presentUserIds: [],
      justified: [{ userId: 'excused', reason: '  Trabalho ' }],
    })

    expect(insertMeeting.mock.calls[0][0]).toMatchObject({ title: null, description: null })
    expect(insertAttendances.mock.calls[0][0]).toContainEqual(
      expect.objectContaining({ userId: 'excused', justificationReason: 'Trabalho' })
    )
  })
})
