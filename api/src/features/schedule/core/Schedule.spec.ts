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

const EVENT_ID = 'event-1'

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
        createdAt: new Date(),
        updatedAt: new Date(),
        teams: [],
      }
      activities.push(activity)
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
  } = {}
): Schedule {
  const built = buildActivityRepositories()
  return new Schedule(
    eventRepository,
    dayRepository,
    options.activityRepository ?? built.activityRepository,
    options.teamRepository ?? built.teamRepository,
    options.teamInstanceRepository ?? buildTeamInstanceRepository()
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

      const model = await schedule.getSchedule()

      expect(model.days).toEqual([
        { id: 'day-fri', date: '2026-04-03', activityCount: 7, activities: [] },
        { id: 'day-sun', date: '2026-04-05', activityCount: 2, activities: [] },
      ])
    })

    it('names the event with its São Paulo start and end dates', async () => {
      const model = await schedule.getSchedule()

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

      const model = await schedule.getSchedule()

      expect(model.event).toMatchObject({ startDate: null, endDate: null })
    })

    it('refuses with no current event', async () => {
      schedule = buildSchedule(buildEventRepository(undefined), dayRepository)

      await expectAppError(schedule.getSchedule(), AppErrorCode.NoCurrentEvent)
    })
  })

  describe('createDay', () => {
    it.each(['2026-04-03', '2026-04-04', '2026-04-05'])(
      'accepts %s, a date inside the event',
      async (date) => {
        const result = await schedule.createDay({ date })

        expect(result.date).toBe(date)
        expect((await schedule.getSchedule()).days.map((day) => day.date)).toEqual([date])
      }
    )

    it.each([
      ['the day before the event', '2026-04-02'],
      ['the day after the event, though UTC has reached it', '2026-04-06'],
    ])('refuses %s', async (_label, date) => {
      await expectAppError(schedule.createDay({ date }), AppErrorCode.Validation)
      expect((await schedule.getSchedule()).days).toEqual([])
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

      expect((await schedule.getSchedule()).days.map((day) => day.date)).toEqual(['2026-04-04'])
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

  describe('createActivity', () => {
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
        buildDayRepository([
          storedDay('day-fri', '2026-04-03'),
          storedDay('day-sat', '2026-04-04'),
        ]),
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
        ...overrides,
      })
    }

    it('adds the activity and its teams, and shows it under its day', async () => {
      schedule = buildActivitySchedule({ teamIds: ['team-a'] })

      const { activityId } = await addActivity(schedule, {
        title: 'Acolhida',
        teamInstanceIds: ['team-a'],
        adminsResponsible: false,
      })

      expect(activityId).toBeTruthy()

      const model = await schedule.getSchedule()
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
})
