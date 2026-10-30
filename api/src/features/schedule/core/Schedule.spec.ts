import { describe, it, expect, beforeEach } from 'vitest'
import { Schedule } from './Schedule.ts'
import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import type { EventModel, ScheduleDayModel } from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type {
  InsertScheduleDayInput,
  ScheduleDayRepository,
} from '../../../modules/schedule-day/domain/ScheduleDayRepository.ts'

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
    schedule = new Schedule(buildEventRepository(buildEvent()), dayRepository)
  })

  describe('getSchedule', () => {
    it('returns the current event days earliest first, with their activity counts', async () => {
      schedule = new Schedule(
        buildEventRepository(buildEvent()),
        buildDayRepository([
          storedDay('day-sun', '2026-04-05', { activityCount: 2 }),
          storedDay('day-fri', '2026-04-03', { activityCount: 7 }),
          storedDay('other', '2026-04-04', { eventId: 'another-event' }),
        ])
      )

      const model = await schedule.getSchedule()

      expect(model.days).toEqual([
        { id: 'day-fri', date: '2026-04-03', activityCount: 7 },
        { id: 'day-sun', date: '2026-04-05', activityCount: 2 },
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
      schedule = new Schedule(
        buildEventRepository(buildEvent({ startsAt: null, endsAt: null })),
        dayRepository
      )

      const model = await schedule.getSchedule()

      expect(model.event).toMatchObject({ startDate: null, endDate: null })
    })

    it('refuses with no current event', async () => {
      schedule = new Schedule(buildEventRepository(undefined), dayRepository)

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
      schedule = new Schedule(
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
      schedule = new Schedule(buildEventRepository(buildEvent()), racingRepository)

      await expectAppError(schedule.createDay({ date: '2026-04-04' }), AppErrorCode.Conflict)
    })

    it('refuses with no current event', async () => {
      schedule = new Schedule(buildEventRepository(undefined), dayRepository)

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
      schedule = new Schedule(
        buildEventRepository(buildEvent()),
        buildDayRepository([storedDay('old-day', '2025-04-04', { eventId: 'past-event' })])
      )

      await expectAppError(schedule.deleteDay('old-day'), AppErrorCode.NotFound)
    })

    it('refuses with no current event', async () => {
      schedule = new Schedule(buildEventRepository(undefined), dayRepository)

      await expectAppError(schedule.deleteDay('day-1'), AppErrorCode.NoCurrentEvent)
    })
  })
})
