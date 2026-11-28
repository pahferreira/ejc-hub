import { describe, it, expect, beforeEach, vi } from 'vitest'

// runInTransaction is mocked to run the callback with a throwaway tx handle so
// the core's write path is exercised without a real database.
vi.mock('../../../core/database/client.ts', () => ({
  runInTransaction: (fn: (tx: unknown) => Promise<unknown>) => fn({ tx: true }),
}))

import { Schedule } from './Schedule.ts'
import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import type {
  EventModel,
  ScheduleActivityModel,
  ScheduleDayModel,
} from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type {
  InsertScheduleDayInput,
  ScheduleDayRepository,
} from '../../../modules/schedule-day/domain/ScheduleDayRepository.ts'
import type {
  InsertScheduleActivityInput,
  ScheduleActivityRepository,
} from '../../../modules/schedule-activity/domain/ScheduleActivityRepository.ts'
import type {
  ScheduleActivityTeamRepository,
  ScheduleActivityTeamRow,
} from '../../../modules/schedule-activity-team/domain/ScheduleActivityTeamRepository.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type {
  EventMembership,
  TeamMembershipRepository,
} from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import type {
  InsertScheduleActivityNoteInput,
  ScheduleActivityNoteRepository,
  ScheduleActivityNoteRow,
} from '../../../modules/schedule-activity-note/domain/ScheduleActivityNoteRepository.ts'
import { SchedulePermissions } from '../../../../../common/permissions/permissions.types.ts'

const EVENT_ID = 'event-1'

// The admin holds `schedule:read`; the others reach the schedule only through a
// `team_memberships` row in the current event.
const ADMIN = { authId: 'auth0|admin', permissions: [SchedulePermissions.Read] }
const MEMBER = { authId: 'auth0|member', permissions: [] }
const COORDINATOR = { authId: 'auth0|coordinator', permissions: [] }
const OUTSIDER = { authId: 'auth0|outsider', permissions: [] }
// The admin running the clock resolves to `user-controller`.
const CONTROLLER_AUTH_ID = 'auth0|controller'

const MEMBERSHIPS: Record<string, EventMembership> = {
  'user-member': { id: 'membership-1', teamInstanceId: 'team-cozinha', type: 'member' },
  'user-coordinator': { id: 'membership-2', teamInstanceId: 'team-liturgia', type: 'coordinator' },
}

/** Every caller resolves to a user named after its Auth0 subject: `auth0|member` → `user-member`. */
function buildUserRepository(): UserRepository {
  return {
    getUser: (authId: string) => Promise.resolve({ id: `user-${authId.split('|')[1]}` }),
  } as unknown as UserRepository
}

/** The current event's memberships, keyed by user id. */
/**
 * An in-memory `schedule_activity_notes`. Each author is named after their user
 * id, with no nickname, and notes come back oldest first like the real query.
 */
function buildNoteRepository(): ScheduleActivityNoteRepository & {
  stored: () => InsertScheduleActivityNoteInput[]
} {
  const notes: (InsertScheduleActivityNoteInput & { id: string; createdAt: Date })[] = []

  return {
    listNotesByEvent: (eventId) =>
      Promise.resolve(
        notes
          .filter((note) => note.eventId === eventId)
          .map(
            (note): ScheduleActivityNoteRow => ({
              id: note.id,
              activityId: note.activityId,
              authorRole: note.authorRole,
              teamInstanceId: note.teamInstanceId,
              body: note.body,
              authorName: note.authorId,
              authorNickname: null,
              createdAt: note.createdAt,
            })
          )
      ),
    insertNote: (input) => {
      const note = { ...input, id: `note-${notes.length + 1}`, createdAt: new Date() }
      notes.push(note)
      return Promise.resolve({ ...note, updatedAt: note.createdAt })
    },
    stored: () =>
      notes.map(({ activityId, eventId, authorId, authorRole, teamInstanceId, body }) => ({
        activityId,
        eventId,
        authorId,
        authorRole,
        teamInstanceId,
        body,
      })),
  }
}

function buildTeamMembershipRepository(
  memberships: Record<string, EventMembership> = MEMBERSHIPS
): TeamMembershipRepository {
  return {
    findMembershipByUserAndEvent: (userId: string, eventId: string) =>
      Promise.resolve(eventId === EVENT_ID ? memberships[userId] : undefined),
  } as unknown as TeamMembershipRepository
}

// Friday 03 to Sunday 05 April 2026 in São Paulo. The end is 23:00 on the 5th,
// which is already the 6th in UTC: the São Paulo date is what counts.
function buildEvent(overrides: Partial<EventModel> = {}): EventModel {
  return {
    id: EVENT_ID,
    name: 'EJC 2026',
    description: '',
    startsAt: new Date('2026-04-03T22:00:00Z'),
    endsAt: new Date('2026-04-06T02:00:00Z'),
    location: null,
    song: null,
    theme: null,
    biblePassage: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    isCurrent: true,
    subscriptionMode: 'open',
    feeAmountCents: 0,
    feeCurrency: 'BRL',
    ...overrides,
  }
}

type StoredDay = ScheduleDayModel & { activityCount: number }

/** An in-memory `schedule_days`, unique on (event, date) like the real table. */
function buildDayRepository(initial: StoredDay[] = []): ScheduleDayRepository {
  let days = [...initial]
  let nextId = 1

  return {
    listDaysByEvent: (eventId) =>
      Promise.resolve(
        days.filter((day) => day.eventId === eventId).sort((a, b) => a.date.localeCompare(b.date))
      ),
    findDayByDate: (eventId, date) =>
      Promise.resolve(days.find((day) => day.eventId === eventId && day.date === date)),
    findDayById: (id, eventId) =>
      Promise.resolve(days.find((day) => day.id === id && day.eventId === eventId)),
    insertDay: (input: InsertScheduleDayInput) => {
      if (days.some((day) => day.eventId === input.eventId && day.date === input.date)) {
        return Promise.reject(
          Object.assign(new Error('duplicate key'), {
            code: '23505',
            constraint: 'schedule_days_event_id_date_unique',
          })
        )
      }
      const day = {
        id: `day-${nextId++}`,
        eventId: input.eventId,
        date: input.date,
        createdAt: new Date(),
        updatedAt: new Date(),
        activityCount: 0,
      }
      days.push(day)
      return Promise.resolve(day)
    },
    updateDayDate: (id, eventId, date) => {
      const day = days.find((candidate) => candidate.id === id && candidate.eventId === eventId)
      if (!day) {
        return Promise.resolve(undefined)
      }
      if (days.some((other) => other !== day && other.eventId === eventId && other.date === date)) {
        return Promise.reject(
          Object.assign(new Error('duplicate key'), {
            code: '23505',
            constraint: 'schedule_days_event_id_date_unique',
          })
        )
      }
      day.date = date
      return Promise.resolve(day)
    },
    deleteDay: (id, eventId) => {
      const day = days.find((candidate) => candidate.id === id && candidate.eventId === eventId)
      days = days.filter((candidate) => candidate !== day)
      return Promise.resolve(day)
    },
  }
}

function storedDay(id: string, date: string, overrides: Partial<StoredDay> = {}): StoredDay {
  return {
    id,
    eventId: EVENT_ID,
    date,
    createdAt: new Date(),
    updatedAt: new Date(),
    activityCount: 0,
    ...overrides,
  }
}

function buildEventRepository(event: EventModel | undefined): EventRepository {
  return { findCurrentEvent: () => Promise.resolve(event) } as unknown as EventRepository
}

type StoredActivity = ScheduleActivityModel & { teams: ScheduleActivityTeamRow[] }

/** An in-memory `schedule_activities` plus its `schedule_activity_teams`. */
function buildActivityRepositories(initial: StoredActivity[] = []) {
  const activities = [...initial]
  let nextId = 1

  const activityRepository: ScheduleActivityRepository = {
    listActivitiesByEvent: (eventId) =>
      Promise.resolve(
        activities
          .filter((activity) => activity.eventId === eventId)
          .sort((a, b) => a.plannedStartsAt.getTime() - b.plannedStartsAt.getTime())
      ),
    insertActivity: (input: InsertScheduleActivityInput) => {
      const activity: StoredActivity = {
        id: `activity-${nextId++}`,
        dayId: input.dayId,
        eventId: input.eventId,
        title: input.title,
        plannedStartsAt: input.plannedStartsAt,
        durationMinutes: input.durationMinutes,
        place: input.place,
        guestName: input.guestName,
        adminsResponsible: input.adminsResponsible,
        allTeams: input.allTeams,
        status: 'planned',
        actualStartedAt: null,
        actualEndedAt: null,
        adjustedDurationMinutes: null,
        controlledBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        teams: [],
      }
      activities.push(activity)
      return Promise.resolve(activity)
    },
    findActivityById: (id, eventId) =>
      Promise.resolve(
        activities.find((activity) => activity.id === id && activity.eventId === eventId)
      ),
    updateActivity: (id, eventId, input: Omit<InsertScheduleActivityInput, 'eventId'>) => {
      const activity = activities.find(
        (candidate) => candidate.id === id && candidate.eventId === eventId
      )
      if (activity) {
        Object.assign(activity, input, { updatedAt: new Date() })
      }
      return Promise.resolve(activity)
    },
    deleteActivity: (id, eventId) => {
      const index = activities.findIndex(
        (activity) => activity.id === id && activity.eventId === eventId
      )
      // Removing the row takes its team links with it, like the FK's cascade.
      const [deleted] = index === -1 ? [] : activities.splice(index, 1)
      return Promise.resolve(deleted)
    },
    updatePlannedStarts: (eventId, updates) => {
      for (const update of updates) {
        const activity = activities.find(
          (candidate) => candidate.id === update.id && candidate.eventId === eventId
        )
        if (activity) {
          activity.plannedStartsAt = update.plannedStartsAt
        }
      }
      return Promise.resolve()
    },
    transitionActivity: (id, eventId, from, transition) => {
      const activity = activities.find(
        (candidate) =>
          candidate.id === id && candidate.eventId === eventId && candidate.status === from
      )
      if (!activity) {
        return Promise.resolve(undefined)
      }
      // The partial unique index: one running activity per event.
      if (
        transition.status === 'running' &&
        activities.some(
          (other) => other !== activity && other.eventId === eventId && other.status === 'running'
        )
      ) {
        return Promise.reject(
          Object.assign(new Error('duplicate key'), {
            code: '23505',
            constraint: 'schedule_activities_one_running_per_event_idx',
          })
        )
      }
      Object.assign(activity, transition, { updatedAt: new Date() })
      return Promise.resolve(activity)
    },
  }

  const teamRepository: ScheduleActivityTeamRepository = {
    listTeamsByEvent: (eventId) =>
      Promise.resolve(
        activities
          .filter((activity) => activity.eventId === eventId)
          .flatMap((activity) => activity.teams)
      ),
    insertTeams: (activityId, teamInstanceIds) => {
      const activity = activities.find((candidate) => candidate.id === activityId)
      if (activity) {
        activity.teams.push(
          ...teamInstanceIds.map((teamInstanceId) => ({
            activityId,
            teamInstanceId,
            teamName: `Team ${teamInstanceId}`,
            teamKey: teamInstanceId,
          }))
        )
      }
      return Promise.resolve()
    },
    replaceTeams: (activityId, teamInstanceIds) => {
      const activity = activities.find((candidate) => candidate.id === activityId)
      if (activity) {
        activity.teams = teamInstanceIds.map((teamInstanceId) => ({
          activityId,
          teamInstanceId,
          teamName: `Team ${teamInstanceId}`,
          teamKey: teamInstanceId,
        }))
      }
      return Promise.resolve()
    },
  }

  return { activityRepository, teamRepository }
}

/** An in-memory team-instance repository: only the ids the event owns. */
function buildTeamInstanceRepository(teamIds: string[] = []): TeamInstanceRepository {
  return {
    listTeamInstances: (eventId?: string) =>
      Promise.resolve(
        teamIds.map((id) => ({
          id,
          eventId: eventId ?? EVENT_ID,
          name: `Team ${id}`,
          templateKey: id,
        }))
      ),
  } as unknown as TeamInstanceRepository
}

function storedActivity(
  id: string,
  dayId: string,
  plannedStartsAt: string,
  durationMinutes: number,
  overrides: Partial<StoredActivity> = {}
): StoredActivity {
  return {
    id,
    dayId,
    eventId: EVENT_ID,
    title: 'Atividade',
    plannedStartsAt: new Date(plannedStartsAt),
    durationMinutes,
    place: 'Salão',
    guestName: null,
    adminsResponsible: false,
    allTeams: false,
    status: 'planned',
    actualStartedAt: null,
    actualEndedAt: null,
    adjustedDurationMinutes: null,
    controlledBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    teams: [],
    ...overrides,
  }
}

/**
 * Builds a `Schedule` with the given event and day repositories, defaulting the
 * activity, activity-team and team-instance repositories so the day-only tests
 * stay short.
 */
function buildSchedule(
  eventRepository: EventRepository,
  dayRepository: ScheduleDayRepository,
  options: {
    activityRepository?: ScheduleActivityRepository
    teamRepository?: ScheduleActivityTeamRepository
    teamInstanceRepository?: TeamInstanceRepository
    teamMembershipRepository?: TeamMembershipRepository
    noteRepository?: ScheduleActivityNoteRepository
  } = {}
): Schedule {
  const built = buildActivityRepositories()
  return new Schedule(
    eventRepository,
    dayRepository,
    options.activityRepository ?? built.activityRepository,
    options.teamRepository ?? built.teamRepository,
    options.teamInstanceRepository ?? buildTeamInstanceRepository(),
    buildUserRepository(),
    options.teamMembershipRepository ?? buildTeamMembershipRepository(),
    options.noteRepository ?? buildNoteRepository()
  )
}

async function expectAppError(promise: Promise<unknown>, code: string) {
  const error = await promise.then(
    () => undefined,
    (caught: unknown) => caught
  )
  expect(error).toBeInstanceOf(AppError)
  expect((error as AppError).getAppErrorCode()).toBe(code)
}

describe('Schedule', () => {
  let dayRepository: ScheduleDayRepository
  let schedule: Schedule

  beforeEach(() => {
    dayRepository = buildDayRepository()
    schedule = buildSchedule(buildEventRepository(buildEvent()), dayRepository)
  })

  describe('getSchedule', () => {
    it('returns the current event days earliest first, with their activity counts', async () => {
      schedule = buildSchedule(
        buildEventRepository(buildEvent()),
        buildDayRepository([
          storedDay('day-sun', '2026-04-05', { activityCount: 2 }),
          storedDay('day-fri', '2026-04-03', { activityCount: 7 }),
          storedDay('other', '2026-04-04', { eventId: 'another-event' }),
        ])
      )

      const model = await schedule.getSchedule(ADMIN)

      expect(model.days).toEqual([
        { id: 'day-fri', date: '2026-04-03', activityCount: 7, activities: [] },
        { id: 'day-sun', date: '2026-04-05', activityCount: 2, activities: [] },
      ])
    })

    it('names the event with its São Paulo start and end dates', async () => {
      const model = await schedule.getSchedule(ADMIN)

      expect(model.event).toEqual({
        name: 'EJC 2026',
        startDate: '2026-04-03',
        endDate: '2026-04-05',
      })
    })

    it('reads an event without dates as null dates', async () => {
      schedule = buildSchedule(
        buildEventRepository(buildEvent({ startsAt: null, endsAt: null })),
        dayRepository
      )

      const model = await schedule.getSchedule(ADMIN)

      expect(model.event).toMatchObject({ startDate: null, endDate: null })
    })

    it('refuses with no current event', async () => {
      schedule = buildSchedule(buildEventRepository(undefined), dayRepository)

      await expectAppError(schedule.getSchedule(ADMIN), AppErrorCode.NoCurrentEvent)
    })

    it('lets in an admin who is not on a team, as admin with no team to highlight', async () => {
      const model = await schedule.getSchedule(ADMIN)

      expect(model.myTeamInstanceId).toBeNull()
      expect(model.viewerRole).toBe('admin')
    })

    it('lets in a member of the current event, with their team to highlight', async () => {
      const model = await schedule.getSchedule(MEMBER)

      expect(model.myTeamInstanceId).toBe('team-cozinha')
      expect(model.viewerRole).toBe('member')
    })

    it('lets in a coordinator of the current event, with their team to highlight', async () => {
      const model = await schedule.getSchedule(COORDINATOR)

      expect(model.myTeamInstanceId).toBe('team-liturgia')
      expect(model.viewerRole).toBe('coordinator')
    })

    it("reads an admin who is also on a team in that team's role", async () => {
      const model = await schedule.getSchedule({ ...MEMBER, permissions: ADMIN.permissions })

      expect(model.myTeamInstanceId).toBe('team-cozinha')
      expect(model.viewerRole).toBe('member')
    })

    it('refuses someone neither on a current-event team nor an admin', async () => {
      await expectAppError(schedule.getSchedule(OUTSIDER), AppErrorCode.Forbidden)
    })
  })

  describe('createDay', () => {
    it.each(['2026-04-03', '2026-04-04', '2026-04-05'])(
      'accepts %s, a date inside the event',
      async (date) => {
        const result = await schedule.createDay({ date })

        expect(result.date).toBe(date)
        expect((await schedule.getSchedule(ADMIN)).days.map((day) => day.date)).toEqual([date])
      }
    )

    it.each([
      ['the day before the event', '2026-04-02'],
      ['the day after the event, though UTC has reached it', '2026-04-06'],
    ])('refuses %s', async (_label, date) => {
      await expectAppError(schedule.createDay({ date }), AppErrorCode.Validation)
      expect((await schedule.getSchedule(ADMIN)).days).toEqual([])
    })

    it('refuses any date when the event has no dates', async () => {
      schedule = buildSchedule(
        buildEventRepository(buildEvent({ startsAt: null, endsAt: null })),
        dayRepository
      )

      await expectAppError(schedule.createDay({ date: '2026-04-03' }), AppErrorCode.Validation)
    })

    it('refuses a date the event already has a day on', async () => {
      await schedule.createDay({ date: '2026-04-04' })

      await expectAppError(schedule.createDay({ date: '2026-04-04' }), AppErrorCode.Conflict)
    })

    it('answers a conflict when a concurrent insert takes the date first', async () => {
      const racingRepository: ScheduleDayRepository = {
        ...buildDayRepository([storedDay('day-sat', '2026-04-04')]),
        // The read saw no day; the unique constraint is what catches the race.
        findDayByDate: () => Promise.resolve(undefined),
      }
      schedule = buildSchedule(buildEventRepository(buildEvent()), racingRepository)

      await expectAppError(schedule.createDay({ date: '2026-04-04' }), AppErrorCode.Conflict)
      // The same sentence the read gives, so the race is invisible to the admin.
      await expect(schedule.createDay({ date: '2026-04-04' })).rejects.toThrow(
        'The event already has a day on this date'
      )
    })

    it.each([
      [
        'another constraint’s violation',
        () =>
          Object.assign(new Error('duplicate key'), {
            code: '23505',
            constraint: 'some_other_unique',
          }),
      ],
      ['an error that is not a unique violation', () => new Error('connection lost')],
    ])('re-throws %s as it is', async (_label, buildFailure) => {
      const failure = buildFailure()
      const failingRepository: ScheduleDayRepository = {
        ...dayRepository,
        insertDay: () => Promise.reject(failure),
      }
      schedule = buildSchedule(buildEventRepository(buildEvent()), failingRepository)

      await expect(schedule.createDay({ date: '2026-04-04' })).rejects.toBe(failure)
    })

    it('refuses with no current event', async () => {
      schedule = buildSchedule(buildEventRepository(undefined), dayRepository)

      await expectAppError(schedule.createDay({ date: '2026-04-03' }), AppErrorCode.NoCurrentEvent)
    })
  })

  describe('deleteDay', () => {
    it('removes the day from the schedule', async () => {
      const { dayId } = await schedule.createDay({ date: '2026-04-03' })
      await schedule.createDay({ date: '2026-04-04' })

      await schedule.deleteDay(dayId)

      expect((await schedule.getSchedule(ADMIN)).days.map((day) => day.date)).toEqual([
        '2026-04-04',
      ])
    })

    it('answers not found for a day of another event', async () => {
      schedule = buildSchedule(
        buildEventRepository(buildEvent()),
        buildDayRepository([storedDay('old-day', '2025-04-04', { eventId: 'past-event' })])
      )

      await expectAppError(schedule.deleteDay('old-day'), AppErrorCode.NotFound)
    })

    it('refuses with no current event', async () => {
      schedule = buildSchedule(buildEventRepository(undefined), dayRepository)

      await expectAppError(schedule.deleteDay('day-1'), AppErrorCode.NoCurrentEvent)
    })
  })

  // 18:00 on the São Paulo clock of Friday 03 April 2026 (UTC-3).
  const FRI_18H = '2026-04-03T21:00:00Z'
  const FRI_1830 = '2026-04-03T21:30:00Z'
  const FRI_1815 = '2026-04-03T21:15:00Z'

  function buildActivitySchedule(
    options: {
      initialActivities?: StoredActivity[]
      teamIds?: string[]
    } = {}
  ) {
    const { activityRepository, teamRepository } = buildActivityRepositories(
      options.initialActivities
    )
    return buildSchedule(
      buildEventRepository(buildEvent()),
      buildDayRepository([storedDay('day-fri', '2026-04-03'), storedDay('day-sat', '2026-04-04')]),
      {
        activityRepository,
        teamRepository,
        teamInstanceRepository: buildTeamInstanceRepository(options.teamIds ?? []),
      }
    )
  }

  function addActivity(
    instance: Schedule,
    overrides: Partial<Parameters<Schedule['createActivity']>[0]> = {}
  ) {
    return instance.createActivity({
      dayId: 'day-fri',
      title: 'Abertura',
      plannedStartsAt: FRI_18H,
      durationMinutes: 30,
      place: 'Salão',
      teamInstanceIds: [],
      guestName: null,
      adminsResponsible: true,
      allTeams: false,
      ...overrides,
    })
  }

  describe('createActivity', () => {
    it('adds the activity and its teams, and shows it under its day', async () => {
      schedule = buildActivitySchedule({ teamIds: ['team-a'] })

      const { activityId } = await addActivity(schedule, {
        title: 'Acolhida',
        teamInstanceIds: ['team-a'],
        adminsResponsible: false,
      })

      expect(activityId).toBeTruthy()

      const model = await schedule.getSchedule(ADMIN)
      const day = model.days.find((candidate) => candidate.id === 'day-fri')

      expect(day?.activities).toHaveLength(1)
      expect(day?.activities[0]).toMatchObject({
        title: 'Acolhida',
        durationMinutes: 30,
        place: 'Salão',
        plannedStartsAt: new Date(FRI_18H).toISOString(),
      })
      expect(day?.activities[0].teams[0]).toMatchObject({ teamInstanceId: 'team-a' })
      expect(day?.activities[0].teams[0].colorToken).toEqual(expect.any(String))
    })

    it('refuses an activity that overlaps another on the day', async () => {
      schedule = buildActivitySchedule()
      await addActivity(schedule, { plannedStartsAt: FRI_18H, durationMinutes: 30 })

      await expectAppError(
        addActivity(schedule, { plannedStartsAt: FRI_1815, durationMinutes: 30 }),
        AppErrorCode.Validation
      )
    })

    it('allows an activity that starts exactly when another ends', async () => {
      schedule = buildActivitySchedule()
      await addActivity(schedule, { plannedStartsAt: FRI_18H, durationMinutes: 30 })

      const { activityId } = await addActivity(schedule, {
        plannedStartsAt: FRI_1830,
        durationMinutes: 15,
      })

      expect(activityId).toBeTruthy()
    })

    it("refuses a start before the day's 00:00 São Paulo time", async () => {
      schedule = buildActivitySchedule()

      // 23:00 on Friday is before Saturday's São Paulo midnight.
      await expectAppError(
        addActivity(schedule, { dayId: 'day-sat', plannedStartsAt: '2026-04-04T02:00:00Z' }),
        AppErrorCode.Validation
      )
    })

    it('allows the last activity to run past midnight', async () => {
      schedule = buildActivitySchedule()

      // Starts 23:00 São Paulo Friday, runs two hours into Saturday.
      const { activityId } = await addActivity(schedule, {
        plannedStartsAt: '2026-04-04T02:00:00Z',
        durationMinutes: 120,
      })

      expect(activityId).toBeTruthy()
    })

    it("refuses an activity that overlaps the next day's first", async () => {
      schedule = buildActivitySchedule({
        // Friday's last runs 23:00–01:00 São Paulo, ending inside Saturday.
        initialActivities: [storedActivity('a1', 'day-fri', '2026-04-04T02:00:00Z', 120)],
      })

      // Saturday's first at 00:30 São Paulo falls inside it.
      await expectAppError(
        addActivity(schedule, { dayId: 'day-sat', plannedStartsAt: '2026-04-04T03:30:00Z' }),
        AppErrorCode.Validation
      )
    })

    it('refuses an activity with nobody responsible', async () => {
      schedule = buildActivitySchedule()

      await expectAppError(
        addActivity(schedule, { teamInstanceIds: [], guestName: null, adminsResponsible: false }),
        AppErrorCode.Validation
      )
    })

    it('adds an all-teams activity with nobody else responsible, shown with no team list', async () => {
      schedule = buildActivitySchedule({ teamIds: ['team-a', 'team-b'] })

      await addActivity(schedule, { title: 'Plenária', allTeams: true, adminsResponsible: false })

      const model = await schedule.getSchedule(ADMIN)
      const day = model.days.find((candidate) => candidate.id === 'day-fri')

      expect(day?.activities[0]).toMatchObject({ title: 'Plenária', allTeams: true, teams: [] })
    })

    it('shows an activity with picked teams as not all teams', async () => {
      schedule = buildActivitySchedule({ teamIds: ['team-a'] })

      await addActivity(schedule, { teamInstanceIds: ['team-a'], adminsResponsible: false })

      const model = await schedule.getSchedule(ADMIN)
      const day = model.days.find((candidate) => candidate.id === 'day-fri')

      expect(day?.activities[0].allTeams).toBe(false)
    })

    it('refuses all teams together with picked teams', async () => {
      schedule = buildActivitySchedule({ teamIds: ['team-a'] })

      await expectAppError(
        addActivity(schedule, { teamInstanceIds: ['team-a'], allTeams: true }),
        AppErrorCode.Validation
      )
    })

    it('refuses a team that belongs to another event', async () => {
      schedule = buildActivitySchedule({ teamIds: ['team-a'] })

      await expectAppError(
        addActivity(schedule, { teamInstanceIds: ['team-other'], adminsResponsible: false }),
        AppErrorCode.Validation
      )
    })

    it('refuses an activity on a day of another event', async () => {
      schedule = buildActivitySchedule()

      await expectAppError(addActivity(schedule, { dayId: 'missing-day' }), AppErrorCode.NotFound)
    })

    it('refuses with no current event', async () => {
      schedule = buildSchedule(buildEventRepository(undefined), dayRepository)

      await expectAppError(addActivity(schedule), AppErrorCode.NoCurrentEvent)
    })
  })

  describe('updateActivity', () => {
    function editActivity(
      instance: Schedule,
      activityId: string,
      overrides: Partial<Parameters<Schedule['updateActivity']>[1]> = {}
    ) {
      return instance.updateActivity(activityId, {
        dayId: 'day-fri',
        title: 'Abertura',
        plannedStartsAt: FRI_18H,
        durationMinutes: 30,
        place: 'Salão',
        teamInstanceIds: [],
        guestName: null,
        adminsResponsible: true,
        allTeams: false,
        ...overrides,
      })
    }

    it('replaces every field and the whole team set', async () => {
      schedule = buildActivitySchedule({
        teamIds: ['team-a', 'team-b', 'team-c'],
        initialActivities: [
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            teams: [
              { activityId: 'a1', teamInstanceId: 'team-a', teamName: 'A', teamKey: 'team-a' },
              { activityId: 'a1', teamInstanceId: 'team-b', teamName: 'B', teamKey: 'team-b' },
            ],
          }),
        ],
      })

      const result = await editActivity(schedule, 'a1', {
        dayId: 'day-sat',
        title: 'Missa',
        plannedStartsAt: '2026-04-04T12:00:00Z',
        durationMinutes: 60,
        place: 'Capela',
        teamInstanceIds: ['team-c'],
        guestName: 'Padre João',
        adminsResponsible: false,
      })

      expect(result).toEqual({ activityId: 'a1' })

      const model = await schedule.getSchedule(ADMIN)
      const friday = model.days.find((day) => day.id === 'day-fri')
      const saturday = model.days.find((day) => day.id === 'day-sat')

      expect(friday?.activities).toEqual([])
      expect(saturday?.activities).toHaveLength(1)
      expect(saturday?.activities[0]).toMatchObject({
        id: 'a1',
        title: 'Missa',
        plannedStartsAt: '2026-04-04T12:00:00.000Z',
        durationMinutes: 60,
        place: 'Capela',
        guestName: 'Padre João',
        adminsResponsible: false,
      })
      expect(saturday?.activities[0].teams.map((team) => team.teamInstanceId)).toEqual(['team-c'])
    })

    it('turns an activity with picked teams into an all-teams one with no team list', async () => {
      schedule = buildActivitySchedule({
        teamIds: ['team-a', 'team-b'],
        initialActivities: [
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            teams: [
              { activityId: 'a1', teamInstanceId: 'team-a', teamName: 'A', teamKey: 'team-a' },
              { activityId: 'a1', teamInstanceId: 'team-b', teamName: 'B', teamKey: 'team-b' },
            ],
          }),
        ],
      })

      await editActivity(schedule, 'a1', {
        teamInstanceIds: [],
        adminsResponsible: false,
        allTeams: true,
      })

      const model = await schedule.getSchedule(ADMIN)
      const day = model.days.find((candidate) => candidate.id === 'day-fri')

      expect(day?.activities[0]).toMatchObject({ id: 'a1', allTeams: true, teams: [] })
    })

    it('turns an all-teams activity back into one with picked teams', async () => {
      schedule = buildActivitySchedule({
        teamIds: ['team-a', 'team-b'],
        initialActivities: [storedActivity('a1', 'day-fri', FRI_18H, 30, { allTeams: true })],
      })

      await editActivity(schedule, 'a1', {
        teamInstanceIds: ['team-b'],
        adminsResponsible: false,
        allTeams: false,
      })

      const model = await schedule.getSchedule(ADMIN)
      const activity = model.days.find((candidate) => candidate.id === 'day-fri')?.activities[0]

      expect(activity?.allTeams).toBe(false)
      expect(activity?.teams.map((team) => team.teamInstanceId)).toEqual(['team-b'])
    })

    it('allows an edit that keeps the activity in its own slot', async () => {
      schedule = buildActivitySchedule({
        initialActivities: [storedActivity('a1', 'day-fri', FRI_18H, 30)],
      })

      // Same slot, a little longer: only the activity itself is there.
      const result = await editActivity(schedule, 'a1', { durationMinutes: 45 })

      expect(result).toEqual({ activityId: 'a1' })
    })

    it('refuses an edit that creates an overlap', async () => {
      schedule = buildActivitySchedule({
        initialActivities: [
          storedActivity('a1', 'day-fri', FRI_18H, 30),
          storedActivity('a2', 'day-fri', FRI_1830, 30),
        ],
      })

      // Stretching the first to 45 minutes runs into the second at 18:30.
      await expectAppError(
        editActivity(schedule, 'a1', { durationMinutes: 45 }),
        AppErrorCode.Validation
      )
    })

    it("refuses changing the teams to another event's team", async () => {
      schedule = buildActivitySchedule({
        teamIds: ['team-a'],
        initialActivities: [storedActivity('a1', 'day-fri', FRI_18H, 30)],
      })

      await expectAppError(
        editActivity(schedule, 'a1', { teamInstanceIds: ['team-other'] }),
        AppErrorCode.Validation
      )
    })

    it('refuses an edit to all teams that keeps picked teams', async () => {
      schedule = buildActivitySchedule({
        teamIds: ['team-a'],
        initialActivities: [storedActivity('a1', 'day-fri', FRI_18H, 30)],
      })

      await expectAppError(
        editActivity(schedule, 'a1', { teamInstanceIds: ['team-a'], allTeams: true }),
        AppErrorCode.Validation
      )
    })

    it('refuses an edit that leaves nobody responsible', async () => {
      schedule = buildActivitySchedule({
        initialActivities: [storedActivity('a1', 'day-fri', FRI_18H, 30)],
      })

      await expectAppError(
        editActivity(schedule, 'a1', {
          teamInstanceIds: [],
          guestName: null,
          adminsResponsible: false,
        }),
        AppErrorCode.Validation
      )
    })

    it('answers not found for an activity of another event', async () => {
      schedule = buildActivitySchedule({
        initialActivities: [
          storedActivity('old', 'day-fri', FRI_18H, 30, { eventId: 'past-event' }),
        ],
      })

      await expectAppError(editActivity(schedule, 'old'), AppErrorCode.NotFound)
    })

    it('answers not found when the activity is deleted while the edit is checked', async () => {
      const { activityRepository, teamRepository } = buildActivityRepositories([
        storedActivity('a1', 'day-fri', FRI_18H, 30),
      ])
      schedule = buildSchedule(
        buildEventRepository(buildEvent()),
        buildDayRepository([storedDay('day-fri', '2026-04-03')]),
        {
          // The read finds it; by the write, another admin has deleted it.
          activityRepository: {
            ...activityRepository,
            updateActivity: () => Promise.resolve(undefined),
          },
          teamRepository,
        }
      )

      await expectAppError(editActivity(schedule, 'a1'), AppErrorCode.NotFound)
    })

    it('refuses with no current event', async () => {
      schedule = buildSchedule(buildEventRepository(undefined), dayRepository)

      await expectAppError(editActivity(schedule, 'a1'), AppErrorCode.NoCurrentEvent)
    })
  })

  describe('deleteActivity', () => {
    it('removes the activity and its team links from the schedule', async () => {
      schedule = buildActivitySchedule({
        initialActivities: [
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            teams: [
              { activityId: 'a1', teamInstanceId: 'team-a', teamName: 'A', teamKey: 'team-a' },
            ],
          }),
          storedActivity('a2', 'day-fri', FRI_1830, 30),
        ],
      })

      const result = await schedule.deleteActivity('a1')

      expect(result).toEqual({ activityId: 'a1' })

      const model = await schedule.getSchedule(ADMIN)
      const friday = model.days.find((day) => day.id === 'day-fri')

      expect(friday?.activities.map((activity) => activity.id)).toEqual(['a2'])
      expect(friday?.activities.flatMap((activity) => activity.teams)).toEqual([])
    })

    it('answers not found for an activity of another event', async () => {
      schedule = buildActivitySchedule({
        initialActivities: [
          storedActivity('old', 'day-fri', FRI_18H, 30, { eventId: 'past-event' }),
        ],
      })

      await expectAppError(schedule.deleteActivity('old'), AppErrorCode.NotFound)
    })

    it('refuses with no current event', async () => {
      schedule = buildSchedule(buildEventRepository(undefined), dayRepository)

      await expectAppError(schedule.deleteActivity('a1'), AppErrorCode.NoCurrentEvent)
    })
  })

  describe('updateDay', () => {
    function buildMoveSchedule(initialActivities: StoredActivity[] = []) {
      const { activityRepository, teamRepository } = buildActivityRepositories(initialActivities)
      return buildSchedule(
        buildEventRepository(buildEvent()),
        buildDayRepository([
          storedDay('day-fri', '2026-04-03'),
          storedDay('day-sat', '2026-04-04'),
        ]),
        { activityRepository, teamRepository }
      )
    }

    it('moves the day and keeps every activity at its São Paulo time of day', async () => {
      schedule = buildMoveSchedule([
        // 18:00 and 23:00–01:00 São Paulo on Friday.
        storedActivity('a1', 'day-fri', '2026-04-03T21:00:00Z', 30),
        storedActivity('a2', 'day-fri', '2026-04-04T02:00:00Z', 120),
      ])

      const result = await schedule.updateDay('day-fri', { date: '2026-04-05' })

      expect(result).toEqual({ dayId: 'day-fri', date: '2026-04-05' })
      const model = await schedule.getSchedule(ADMIN)
      const day = model.days.find((candidate) => candidate.id === 'day-fri')
      expect(day?.date).toBe('2026-04-05')
      expect(day?.activities.map((activity) => activity.plannedStartsAt)).toEqual([
        '2026-04-05T21:00:00.000Z',
        '2026-04-06T02:00:00.000Z',
      ])
    })

    it.each(['2026-04-02', '2026-04-06'])(
      'refuses %s, a date outside the event, and leaves the day where it was',
      async (date) => {
        schedule = buildMoveSchedule([storedActivity('a1', 'day-fri', '2026-04-03T21:00:00Z', 30)])

        await expectAppError(schedule.updateDay('day-fri', { date }), AppErrorCode.Validation)

        const model = await schedule.getSchedule(ADMIN)
        const day = model.days.find((candidate) => candidate.id === 'day-fri')
        expect(day?.date).toBe('2026-04-03')
        expect(day?.activities[0].plannedStartsAt).toBe('2026-04-03T21:00:00.000Z')
      }
    )

    it("refuses moving onto another day's date", async () => {
      schedule = buildMoveSchedule()

      await expectAppError(
        schedule.updateDay('day-fri', { date: '2026-04-04' }),
        AppErrorCode.Conflict
      )
    })

    it('answers a conflict when a concurrent write takes the date first', async () => {
      const racingDays = buildDayRepository([storedDay('day-fri', '2026-04-03')])
      // The read misses the other day; the unique constraint still refuses the write.
      racingDays.findDayByDate = () => Promise.resolve(undefined)
      await racingDays.insertDay({ eventId: EVENT_ID, date: '2026-04-05' })
      schedule = buildSchedule(buildEventRepository(buildEvent()), racingDays)

      await expectAppError(
        schedule.updateDay('day-fri', { date: '2026-04-05' }),
        AppErrorCode.Conflict
      )
    })

    describe('against the days around its new date', () => {
      // Friday 03 and Sunday 05, Saturday free to move onto.
      function buildNeighbourSchedule(initialActivities: StoredActivity[]) {
        const { activityRepository, teamRepository } = buildActivityRepositories(initialActivities)
        return buildSchedule(
          buildEventRepository(buildEvent()),
          buildDayRepository([
            storedDay('day-fri', '2026-04-03'),
            storedDay('day-sun', '2026-04-05'),
          ]),
          { activityRepository, teamRepository }
        )
      }

      it("refuses a past-midnight activity that would overlap the next day's first", async () => {
        schedule = buildNeighbourSchedule([
          // Friday 23:00–01:00 São Paulo; moved to Saturday it ends 01:00 Sunday.
          storedActivity('a1', 'day-fri', '2026-04-04T02:00:00Z', 120),
          // Sunday 00:30 São Paulo.
          storedActivity('a2', 'day-sun', '2026-04-05T03:30:00Z', 30),
        ])

        await expectAppError(
          schedule.updateDay('day-fri', { date: '2026-04-04' }),
          AppErrorCode.Validation
        )

        const model = await schedule.getSchedule(ADMIN)
        expect(model.days.map((day) => day.date)).toEqual(['2026-04-03', '2026-04-05'])
        expect(model.days[0].activities[0].plannedStartsAt).toBe('2026-04-04T02:00:00.000Z')
      })

      it("refuses a first activity that would overlap the previous day's past-midnight one", async () => {
        schedule = buildNeighbourSchedule([
          // Friday 23:00–01:00 São Paulo, ending inside Saturday.
          storedActivity('a1', 'day-fri', '2026-04-04T02:00:00Z', 120),
          // Sunday 00:30 São Paulo; moved to Saturday it falls inside Friday's last.
          storedActivity('a2', 'day-sun', '2026-04-05T03:30:00Z', 30),
        ])

        await expectAppError(
          schedule.updateDay('day-sun', { date: '2026-04-04' }),
          AppErrorCode.Validation
        )
      })

      it('allows a move that only touches the neighbouring activities', async () => {
        schedule = buildNeighbourSchedule([
          // Friday 23:00–01:00 São Paulo.
          storedActivity('a1', 'day-fri', '2026-04-04T02:00:00Z', 120),
          // Sunday 01:00 São Paulo; moved to Saturday it starts as Friday's last ends.
          storedActivity('a2', 'day-sun', '2026-04-05T04:00:00Z', 30),
        ])

        const result = await schedule.updateDay('day-sun', { date: '2026-04-04' })

        expect(result).toEqual({ dayId: 'day-sun', date: '2026-04-04' })
      })
    })

    it('keeps a day on its own date as it is', async () => {
      schedule = buildMoveSchedule([storedActivity('a1', 'day-fri', '2026-04-03T21:00:00Z', 30)])

      const result = await schedule.updateDay('day-fri', { date: '2026-04-03' })

      expect(result).toEqual({ dayId: 'day-fri', date: '2026-04-03' })
      const model = await schedule.getSchedule(ADMIN)
      expect(model.days[0].activities[0].plannedStartsAt).toBe('2026-04-03T21:00:00.000Z')
    })

    it('answers not found for a day of another event', async () => {
      schedule = buildMoveSchedule()

      await expectAppError(
        schedule.updateDay('missing-day', { date: '2026-04-05' }),
        AppErrorCode.NotFound
      )
    })

    it('refuses with no current event', async () => {
      schedule = buildSchedule(buildEventRepository(undefined), dayRepository)

      await expectAppError(
        schedule.updateDay('day-fri', { date: '2026-04-05' }),
        AppErrorCode.NoCurrentEvent
      )
    })
  })

  describe('running the clock', () => {
    // Friday 18:00, 18:30 and 19:00 in São Paulo, then Saturday 09:00.
    const FRI_19H = '2026-04-03T22:00:00Z'
    const SAT_09H = '2026-04-04T12:00:00Z'
    const NOW = new Date('2026-04-03T21:05:00Z')

    let activityRepository: ScheduleActivityRepository

    function buildClockSchedule(initialActivities: StoredActivity[]) {
      const built = buildActivityRepositories(initialActivities)
      activityRepository = built.activityRepository
      return buildSchedule(
        buildEventRepository(buildEvent()),
        buildDayRepository([
          storedDay('day-fri', '2026-04-03'),
          storedDay('day-sat', '2026-04-04'),
        ]),
        { activityRepository: built.activityRepository, teamRepository: built.teamRepository }
      )
    }

    async function stored(id: string) {
      return activityRepository.findActivityById(id, EVENT_ID)
    }

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(NOW)
      return () => {
        vi.useRealTimers()
      }
    })

    describe('startActivity', () => {
      it("starts the day's first planned activity and records who started it", async () => {
        schedule = buildClockSchedule([
          storedActivity('a1', 'day-fri', FRI_18H, 30),
          storedActivity('a2', 'day-fri', FRI_1830, 30),
        ])

        const result = await schedule.startActivity('a1', {
          expectedStatus: 'planned',
          controllerAuthId: CONTROLLER_AUTH_ID,
        })

        expect(result).toEqual({ activityId: 'a1', finishedActivityId: null })
        expect(await stored('a1')).toMatchObject({
          status: 'running',
          actualStartedAt: NOW,
          actualEndedAt: null,
          controlledBy: 'user-controller',
        })
      })

      it('finishes the running activity in the same step', async () => {
        schedule = buildClockSchedule([
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            status: 'running',
            actualStartedAt: new Date(FRI_18H),
          }),
          storedActivity('a2', 'day-fri', FRI_1830, 30),
        ])

        const result = await schedule.startActivity('a2', {
          expectedStatus: 'planned',
          controllerAuthId: CONTROLLER_AUTH_ID,
        })

        expect(result).toEqual({ activityId: 'a2', finishedActivityId: 'a1' })
        expect(await stored('a1')).toMatchObject({
          status: 'done',
          actualStartedAt: new Date(FRI_18H),
          actualEndedAt: NOW,
          controlledBy: 'user-controller',
        })
        expect(await stored('a2')).toMatchObject({ status: 'running', actualStartedAt: NOW })
      })

      it("finishes another day's running activity too: one runs per event", async () => {
        schedule = buildClockSchedule([
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            status: 'running',
            actualStartedAt: new Date(FRI_18H),
          }),
          storedActivity('s1', 'day-sat', SAT_09H, 30),
        ])

        await schedule.startActivity('s1', {
          expectedStatus: 'planned',
          controllerAuthId: CONTROLLER_AUTH_ID,
        })

        expect(await stored('a1')).toMatchObject({ status: 'done', actualEndedAt: NOW })
        expect(await stored('s1')).toMatchObject({ status: 'running' })
      })

      it('skips past done and skipped activities to find the next planned one', async () => {
        schedule = buildClockSchedule([
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            status: 'done',
            actualStartedAt: new Date(FRI_18H),
            actualEndedAt: new Date(FRI_1830),
          }),
          storedActivity('a2', 'day-fri', FRI_1830, 30, { status: 'skipped' }),
          storedActivity('a3', 'day-fri', FRI_19H, 30),
        ])

        await schedule.startActivity('a3', {
          expectedStatus: 'planned',
          controllerAuthId: CONTROLLER_AUTH_ID,
        })

        expect(await stored('a3')).toMatchObject({ status: 'running' })
      })

      it('refuses an out-of-order start, leaving everything as it was', async () => {
        schedule = buildClockSchedule([
          storedActivity('a1', 'day-fri', FRI_18H, 30),
          storedActivity('a2', 'day-fri', FRI_1830, 30),
        ])

        await expectAppError(
          schedule.startActivity('a2', {
            expectedStatus: 'planned',
            controllerAuthId: CONTROLLER_AUTH_ID,
          }),
          AppErrorCode.Validation
        )
        expect(await stored('a2')).toMatchObject({ status: 'planned', actualStartedAt: null })
      })

      it('answers a conflict when the stored status is not the expected one', async () => {
        schedule = buildClockSchedule([
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            status: 'running',
            actualStartedAt: new Date(FRI_18H),
          }),
        ])

        await expectAppError(
          schedule.startActivity('a1', {
            expectedStatus: 'planned',
            controllerAuthId: CONTROLLER_AUTH_ID,
          }),
          AppErrorCode.Conflict
        )
      })

      it.each(['running', 'done', 'skipped'] as const)(
        'refuses to start an activity that is %s',
        async (status) => {
          schedule = buildClockSchedule([
            storedActivity('a1', 'day-fri', FRI_18H, 30, {
              status,
              actualStartedAt: status === 'skipped' ? null : new Date(FRI_18H),
              actualEndedAt: status === 'done' ? new Date(FRI_1830) : null,
            }),
          ])

          await expectAppError(
            schedule.startActivity('a1', {
              expectedStatus: status,
              controllerAuthId: CONTROLLER_AUTH_ID,
            }),
            AppErrorCode.Validation
          )
        }
      )

      it('answers a conflict when another admin starts an activity at the same time', async () => {
        schedule = buildClockSchedule([storedActivity('a1', 'day-fri', FRI_18H, 30)])
        // The read saw nothing running; the one-running index is what catches the race.
        const racing = activityRepository.transitionActivity
        activityRepository.transitionActivity = () =>
          Promise.reject(
            Object.assign(new Error('duplicate key'), {
              code: '23505',
              constraint: 'schedule_activities_one_running_per_event_idx',
            })
          )

        await expectAppError(
          schedule.startActivity('a1', {
            expectedStatus: 'planned',
            controllerAuthId: CONTROLLER_AUTH_ID,
          }),
          AppErrorCode.Conflict
        )
        activityRepository.transitionActivity = racing
      })

      it('answers not found for an activity of another event', async () => {
        schedule = buildClockSchedule([
          storedActivity('old', 'day-fri', FRI_18H, 30, { eventId: 'past-event' }),
        ])

        await expectAppError(
          schedule.startActivity('old', {
            expectedStatus: 'planned',
            controllerAuthId: CONTROLLER_AUTH_ID,
          }),
          AppErrorCode.NotFound
        )
      })
    })

    describe('finishActivity', () => {
      it('finishes the running activity without starting the next one', async () => {
        schedule = buildClockSchedule([
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            status: 'running',
            actualStartedAt: new Date(FRI_18H),
          }),
          storedActivity('a2', 'day-fri', FRI_1830, 30),
        ])

        const result = await schedule.finishActivity('a1', {
          expectedStatus: 'running',
          controllerAuthId: CONTROLLER_AUTH_ID,
        })

        expect(result).toEqual({ activityId: 'a1' })
        expect(await stored('a1')).toMatchObject({
          status: 'done',
          actualStartedAt: new Date(FRI_18H),
          actualEndedAt: NOW,
          controlledBy: 'user-controller',
        })
        expect(await stored('a2')).toMatchObject({ status: 'planned' })
      })

      it.each(['planned', 'done', 'skipped'] as const)(
        'refuses to finish an activity that is %s',
        async (status) => {
          schedule = buildClockSchedule([
            storedActivity('a1', 'day-fri', FRI_18H, 30, {
              status,
              actualStartedAt: status === 'done' ? new Date(FRI_18H) : null,
              actualEndedAt: status === 'done' ? new Date(FRI_1830) : null,
            }),
          ])

          await expectAppError(
            schedule.finishActivity('a1', {
              expectedStatus: status,
              controllerAuthId: CONTROLLER_AUTH_ID,
            }),
            AppErrorCode.Validation
          )
        }
      )

      it('answers a conflict when the stored status is not the expected one', async () => {
        schedule = buildClockSchedule([
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            status: 'done',
            actualStartedAt: new Date(FRI_18H),
            actualEndedAt: new Date(FRI_1830),
          }),
        ])

        await expectAppError(
          schedule.finishActivity('a1', {
            expectedStatus: 'running',
            controllerAuthId: CONTROLLER_AUTH_ID,
          }),
          AppErrorCode.Conflict
        )
      })

      it('answers a conflict when another admin finished it since the read', async () => {
        schedule = buildClockSchedule([
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            status: 'running',
            actualStartedAt: new Date(FRI_18H),
          }),
        ])
        activityRepository.transitionActivity = () => Promise.resolve(undefined)

        await expectAppError(
          schedule.finishActivity('a1', {
            expectedStatus: 'running',
            controllerAuthId: CONTROLLER_AUTH_ID,
          }),
          AppErrorCode.Conflict
        )
      })

      it('answers not found for an activity of another event', async () => {
        schedule = buildClockSchedule([
          storedActivity('old', 'day-fri', FRI_18H, 30, { eventId: 'past-event' }),
        ])

        await expectAppError(
          schedule.finishActivity('old', {
            expectedStatus: 'running',
            controllerAuthId: CONTROLLER_AUTH_ID,
          }),
          AppErrorCode.NotFound
        )
      })
    })

    describe('getSchedule', () => {
      it('answers each activity status, actual times and effective duration, and the server clock', async () => {
        schedule = buildClockSchedule([
          storedActivity('a1', 'day-fri', FRI_18H, 30, {
            status: 'done',
            actualStartedAt: new Date(FRI_18H),
            actualEndedAt: new Date(FRI_1830),
          }),
          storedActivity('a2', 'day-fri', FRI_1830, 30, {
            status: 'running',
            actualStartedAt: new Date(FRI_1830),
            adjustedDurationMinutes: 20,
          }),
          storedActivity('a3', 'day-fri', FRI_19H, 45),
        ])

        const model = await schedule.getSchedule(ADMIN)
        const activities = model.days.find((day) => day.id === 'day-fri')?.activities

        expect(model.serverNow).toBe(NOW.toISOString())
        expect(activities?.map((activity) => activity.id)).toEqual(['a1', 'a2', 'a3'])
        expect(activities?.[0]).toMatchObject({
          status: 'done',
          actualStartedAt: new Date(FRI_18H).toISOString(),
          actualEndedAt: new Date(FRI_1830).toISOString(),
          adjustedDurationMinutes: null,
          effectiveDurationMinutes: 30,
        })
        expect(activities?.[1]).toMatchObject({
          status: 'running',
          actualStartedAt: new Date(FRI_1830).toISOString(),
          actualEndedAt: null,
          adjustedDurationMinutes: 20,
          effectiveDurationMinutes: 20,
        })
        expect(activities?.[2]).toMatchObject({
          status: 'planned',
          actualStartedAt: null,
          actualEndedAt: null,
          effectiveDurationMinutes: 45,
        })
      })
    })
  })

  describe('Observações', () => {
    // Runs the clock, so writes as an admin. Not on any team.
    const CHIEF = {
      authId: 'auth0|chief',
      permissions: [SchedulePermissions.Read, SchedulePermissions.Control],
    }
    // COORDINATOR coordinates Liturgia and MEMBER is on Cozinha (MEMBERSHIPS);
    // these fill in the other side of each team.
    const LITURGIA_MEMBER = { authId: 'auth0|cantor', permissions: [] }
    const COZINHA_COORDINATOR = { authId: 'auth0|chef', permissions: [] }
    const LITURGIA = 'team-liturgia'
    const COZINHA = 'team-cozinha'

    let memberships: Record<string, EventMembership>
    let noteRepository: ReturnType<typeof buildNoteRepository>
    let teamRepository: ScheduleActivityTeamRepository

    function buildNotesSchedule(activities: StoredActivity[]) {
      const built = buildActivityRepositories(activities)
      teamRepository = built.teamRepository
      return buildSchedule(
        buildEventRepository(buildEvent()),
        buildDayRepository([storedDay('day-fri', '2026-04-03')]),
        {
          activityRepository: built.activityRepository,
          teamRepository: built.teamRepository,
          teamMembershipRepository: buildTeamMembershipRepository(memberships),
          noteRepository,
        }
      )
    }

    function team(activityId: string, teamInstanceId: string): ScheduleActivityTeamRow {
      return { activityId, teamInstanceId, teamName: teamInstanceId, teamKey: teamInstanceId }
    }

    function activityWith(teams: 'liturgia' | 'none' | 'all') {
      return storedActivity('act', 'day-fri', '2026-04-03T21:00:00Z', 30, {
        teams: teams === 'liturgia' ? [team('act', LITURGIA)] : [],
        allTeams: teams === 'all',
        guestName: teams === 'none' ? 'Padre João' : null,
      })
    }

    async function notesSeenBy(viewer: { authId: string; permissions: string[] }) {
      const model = await schedule.getSchedule(viewer)
      const activity = model.days.flatMap((day) => day.activities).find((a) => a.id === 'act')
      return activity?.notes.map((note) => note.body) ?? []
    }

    beforeEach(() => {
      memberships = {
        ...MEMBERSHIPS,
        'user-cantor': { id: 'membership-3', teamInstanceId: LITURGIA, type: 'member' },
        'user-chef': { id: 'membership-4', teamInstanceId: COZINHA, type: 'coordinator' },
      }
      noteRepository = buildNoteRepository()
    })

    describe('createNote', () => {
      beforeEach(() => {
        schedule = buildNotesSchedule([activityWith('liturgia')])
      })

      it('writes as an admin, with no team, for whoever runs the clock', async () => {
        const result = await schedule.createNote('act', {
          authorAuthId: CHIEF.authId,
          permissions: CHIEF.permissions,
          body: 'Atrasar 5 min',
        })

        expect(result).toEqual({ noteId: 'note-1', activityId: 'act' })
        expect(noteRepository.stored()).toEqual([
          {
            activityId: 'act',
            eventId: EVENT_ID,
            authorId: 'user-chief',
            authorRole: 'admin',
            teamInstanceId: null,
            body: 'Atrasar 5 min',
          },
        ])
      })

      it('writes as a coordinator, keeping their team', async () => {
        await schedule.createNote('act', {
          authorAuthId: COORDINATOR.authId,
          permissions: COORDINATOR.permissions,
          body: 'Levar os violões',
        })

        expect(noteRepository.stored()).toEqual([
          expect.objectContaining({
            authorId: 'user-coordinator',
            authorRole: 'coordinator',
            teamInstanceId: LITURGIA,
          }),
        ])
      })

      it("keeps the coordinator's team at write time when they later move team", async () => {
        await schedule.createNote('act', {
          authorAuthId: COORDINATOR.authId,
          permissions: COORDINATOR.permissions,
          body: 'Levar os violões',
        })
        memberships['user-coordinator'] = {
          id: 'membership-2',
          teamInstanceId: COZINHA,
          type: 'coordinator',
        }

        expect(await notesSeenBy(LITURGIA_MEMBER)).toEqual(['Levar os violões'])
        expect(await notesSeenBy(MEMBER)).toEqual([])
      })

      it('refuses a member, writing nothing', async () => {
        await expectAppError(
          schedule.createNote('act', {
            authorAuthId: MEMBER.authId,
            permissions: MEMBER.permissions,
            body: 'Oi',
          }),
          AppErrorCode.Forbidden
        )
        expect(noteRepository.stored()).toEqual([])
      })

      it('refuses an admin who does not run the clock and is on no team', async () => {
        await expectAppError(
          schedule.createNote('act', {
            authorAuthId: ADMIN.authId,
            permissions: ADMIN.permissions,
            body: 'Oi',
          }),
          AppErrorCode.Forbidden
        )
      })

      it('refuses someone on no team of the current event', async () => {
        await expectAppError(
          schedule.createNote('act', {
            authorAuthId: OUTSIDER.authId,
            permissions: OUTSIDER.permissions,
            body: 'Oi',
          }),
          AppErrorCode.Forbidden
        )
      })

      it('answers not found for an activity of another event', async () => {
        await expectAppError(
          schedule.createNote('missing', {
            authorAuthId: CHIEF.authId,
            permissions: CHIEF.permissions,
            body: 'Oi',
          }),
          AppErrorCode.NotFound
        )
      })

      it('answers not found when the activity is deleted before the insert', async () => {
        // The activity FK refuses the insert: Postgres' foreign_key_violation,
        // wrapped the way Drizzle wraps driver errors.
        noteRepository.insertNote = () =>
          Promise.reject(
            Object.assign(new Error('Failed query'), {
              cause: Object.assign(new Error('violates foreign key constraint'), {
                code: '23503',
                constraint: 'schedule_activity_notes_activity_id_schedule_activities_id_fk',
              }),
            })
          )

        await expectAppError(
          schedule.createNote('act', {
            authorAuthId: CHIEF.authId,
            permissions: CHIEF.permissions,
            body: 'Oi',
          }),
          AppErrorCode.NotFound
        )
      })

      it("checks the coordinator's membership and inserts in the same transaction", async () => {
        const findMembership = vi.fn(() =>
          Promise.resolve(memberships['user-coordinator'] as EventMembership | undefined)
        )
        const insertNote = vi.spyOn(noteRepository, 'insertNote')
        schedule = buildSchedule(
          buildEventRepository(buildEvent()),
          buildDayRepository([storedDay('day-fri', '2026-04-03')]),
          {
            ...buildActivityRepositories([activityWith('liturgia')]),
            teamMembershipRepository: {
              findMembershipByUserAndEvent: findMembership,
            } as unknown as TeamMembershipRepository,
            noteRepository,
          }
        )

        await schedule.createNote('act', {
          authorAuthId: COORDINATOR.authId,
          permissions: COORDINATOR.permissions,
          body: 'Levar os violões',
        })

        expect(findMembership).toHaveBeenCalledWith('user-coordinator', EVENT_ID, { tx: true })
        expect(insertNote).toHaveBeenCalledWith(expect.anything(), { tx: true })
      })

      it('refuses with no current event', async () => {
        schedule = buildSchedule(buildEventRepository(undefined), dayRepository, { noteRepository })

        await expectAppError(
          schedule.createNote('act', {
            authorAuthId: CHIEF.authId,
            permissions: CHIEF.permissions,
            body: 'Oi',
          }),
          AppErrorCode.NoCurrentEvent
        )
      })
    })

    describe('getSchedule', () => {
      const readers = {
        admin: CHIEF,
        'Liturgia coordinator': COORDINATOR,
        'Liturgia member': LITURGIA_MEMBER,
        'Cozinha coordinator': COZINHA_COORDINATOR,
        'Cozinha member': MEMBER,
      }
      type Reader = keyof typeof readers

      // How the activity's teams stand when the note is read:
      // - on: Liturgia is the activity's team;
      // - removed: Liturgia was its team when the note was written, Cozinha is now;
      // - none: no team (a guest is responsible);
      // - all: every team, as the live wildcard.
      type Teams = 'on' | 'removed' | 'none' | 'all'

      async function writeAndRead(author: 'admin' | 'coordinator', teams: Teams) {
        schedule = buildNotesSchedule([
          activityWith(teams === 'none' ? 'none' : teams === 'all' ? 'all' : 'liturgia'),
        ])
        const writer = author === 'admin' ? CHIEF : COORDINATOR
        await schedule.createNote('act', {
          authorAuthId: writer.authId,
          permissions: writer.permissions,
          body: 'Nota',
        })

        if (teams === 'removed') {
          await teamRepository.replaceTeams('act', [COZINHA], EVENT_ID)
        }

        const seen: Reader[] = []
        for (const [name, viewer] of Object.entries(readers)) {
          if ((await notesSeenBy(viewer)).length > 0) {
            seen.push(name as Reader)
          }
        }
        return seen
      }

      it.each<[Teams, Reader[]]>([
        ['on', ['admin', 'Liturgia coordinator', 'Liturgia member']],
        ['removed', ['admin', 'Liturgia coordinator', 'Liturgia member']],
        ['none', ['admin', 'Liturgia coordinator', 'Liturgia member']],
        ['all', ['admin', 'Liturgia coordinator', 'Liturgia member']],
      ])(
        "shows a Liturgia coordinator's note to admins and Liturgia only (activity teams: %s)",
        async (teams, expected) => {
          expect(await writeAndRead('coordinator', teams)).toEqual(expected)
        }
      )

      it.each<[Teams, Reader[]]>([
        ['on', ['admin', 'Liturgia coordinator']],
        ['removed', ['admin', 'Cozinha coordinator']],
        ['none', ['admin']],
        ['all', ['admin', 'Liturgia coordinator', 'Cozinha coordinator']],
      ])(
        "shows an admin's note to admins and the current teams' coordinators, never members (activity teams: %s)",
        async (teams, expected) => {
          expect(await writeAndRead('admin', teams)).toEqual(expected)
        }
      )

      it('shows no notes to a schedule:read holder who is on no team and does not run the clock', async () => {
        schedule = buildNotesSchedule([activityWith('liturgia')])
        await schedule.createNote('act', {
          authorAuthId: COORDINATOR.authId,
          permissions: COORDINATOR.permissions,
          body: 'Da Liturgia',
        })
        await schedule.createNote('act', {
          authorAuthId: CHIEF.authId,
          permissions: CHIEF.permissions,
          body: 'Da coordenação geral',
        })

        const model = await schedule.getSchedule(ADMIN)

        expect(model.viewerRole).toBe('admin')
        expect(model.days[0]?.activities[0]?.notes).toEqual([])
      })

      it('shows a schedule:read holder on a team only what their team role reads', async () => {
        memberships['user-admin'] = { id: 'membership-5', teamInstanceId: LITURGIA, type: 'member' }
        schedule = buildNotesSchedule([activityWith('liturgia')])
        await schedule.createNote('act', {
          authorAuthId: COORDINATOR.authId,
          permissions: COORDINATOR.permissions,
          body: 'Da Liturgia',
        })
        await schedule.createNote('act', {
          authorAuthId: CHIEF.authId,
          permissions: CHIEF.permissions,
          body: 'Da coordenação geral',
        })

        expect(await notesSeenBy(ADMIN)).toEqual(['Da Liturgia'])
      })

      it('shows every note to an admin who runs the clock while on a team', async () => {
        memberships['user-chief'] = { id: 'membership-5', teamInstanceId: COZINHA, type: 'member' }
        schedule = buildNotesSchedule([activityWith('none')])
        await schedule.createNote('act', {
          authorAuthId: COORDINATOR.authId,
          permissions: COORDINATOR.permissions,
          body: 'Da Liturgia',
        })
        await schedule.createNote('act', {
          authorAuthId: CHIEF.authId,
          permissions: CHIEF.permissions,
          body: 'Da coordenação geral',
        })

        expect(await notesSeenBy(CHIEF)).toEqual(['Da Liturgia', 'Da coordenação geral'])
      })

      it('stacks notes oldest first, each with its author, role and time', async () => {
        vi.useFakeTimers()
        try {
          schedule = buildNotesSchedule([activityWith('liturgia')])
          vi.setSystemTime(new Date('2026-04-03T17:32:00Z'))
          await schedule.createNote('act', {
            authorAuthId: COORDINATOR.authId,
            permissions: COORDINATOR.permissions,
            body: 'Primeira',
          })
          vi.setSystemTime(new Date('2026-04-03T17:40:00Z'))
          await schedule.createNote('act', {
            authorAuthId: CHIEF.authId,
            permissions: CHIEF.permissions,
            body: 'Segunda',
          })

          const model = await schedule.getSchedule(CHIEF)

          expect(model.days[0]?.activities[0]?.notes).toEqual([
            {
              id: 'note-1',
              body: 'Primeira',
              authorName: 'user-coordinator',
              authorRole: 'coordinator',
              createdAt: '2026-04-03T17:32:00.000Z',
            },
            {
              id: 'note-2',
              body: 'Segunda',
              authorName: 'user-chief',
              authorRole: 'admin',
              createdAt: '2026-04-03T17:40:00.000Z',
            },
          ])
        } finally {
          vi.useRealTimers()
        }
      })

      it('answers no notes on an activity nobody wrote on', async () => {
        schedule = buildNotesSchedule([activityWith('liturgia')])

        expect(await notesSeenBy(CHIEF)).toEqual([])
      })
    })
  })
})
