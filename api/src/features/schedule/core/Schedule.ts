import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { isUniqueViolation } from '../../../shared/is-unique-violation.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { ScheduleDayRepository } from '../../../modules/schedule-day/domain/ScheduleDayRepository.ts'
import { toEventDate } from '../../../../../common/schedule/toEventDate.ts'
import type {
  CreateScheduleDayInput,
  CreateScheduleDayResult,
  DeleteScheduleDayResult,
  ScheduleEvent,
  ScheduleReadModel,
} from '../domain/schedule.types.ts'

const DAY_DATE_UNIQUE = 'schedule_days_event_id_date_unique'

/**
 * The event's name and its São Paulo start and end dates.
 *
 * `starts_at`/`ends_at` are plain `timestamp` columns read as UTC instants, so
 * an event ending at 23:00 on a Sunday is already Monday in UTC. Reading them in
 * São Paulo is what keeps that Sunday the last day.
 */
function scheduleEvent(event: EventModel): ScheduleEvent {
  return {
    name: event.name,
    startDate: event.startsAt ? toEventDate(event.startsAt) : null,
    endDate: event.endsAt ? toEventDate(event.endsAt) : null,
  }
}

/**
 * The single entry point for schedule (Cronograma) reads and writes.
 *
 * Repositories are injected so the core logic can be unit-tested with stubs.
 * Everything is scoped to the current event: there is no planning for any other.
 */
export class Schedule {
  #eventRepository: EventRepository
  #scheduleDayRepository: ScheduleDayRepository

  constructor(eventRepo: EventRepository, scheduleDayRepo: ScheduleDayRepository) {
    this.#eventRepository = eventRepo
    this.#scheduleDayRepository = scheduleDayRepo
  }

  // Resolves the current event once per call and hands it to `fn`.
  async #withCurrentEvent<T>(fn: (event: EventModel) => Promise<T>): Promise<T> {
    const currentEvent = await this.#eventRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set', AppErrorCode.NoCurrentEvent)
    }

    return fn(currentEvent)
  }

  /** The current event's days, earliest date first. */
  async getSchedule(): Promise<ScheduleReadModel> {
    return this.#withCurrentEvent(async (event) => {
      const days = await this.#scheduleDayRepository.listDaysByEvent(event.id)

      return {
        event: scheduleEvent(event),
        days: days.map((day) => ({
          id: day.id,
          date: day.date,
          activityCount: day.activityCount,
        })),
      }
    })
  }

  /**
   * Adds a day on a date of the current event.
   *
   * The date must fall within the event's São Paulo dates, and the event must
   * not already have a day on it. The read gives the friendly 409; the unique
   * constraint is what catches two admins adding the same date at once.
   */
  async createDay(input: CreateScheduleDayInput): Promise<CreateScheduleDayResult> {
    return this.#withCurrentEvent(async (event) => {
      const { startDate, endDate } = scheduleEvent(event)

      if (!startDate || !endDate) {
        throw new AppError('The current event has no dates set', AppErrorCode.Validation)
      }

      // `YYYY-MM-DD` strings compare as days.
      if (input.date < startDate || input.date > endDate) {
        throw new AppError('The date is outside the event dates', AppErrorCode.Validation)
      }

      const existing = await this.#scheduleDayRepository.findDayByDate(event.id, input.date)

      if (existing) {
        throw new AppError('The event already has a day on this date', AppErrorCode.Conflict)
      }

      try {
        const day = await this.#scheduleDayRepository.insertDay({
          eventId: event.id,
          date: input.date,
        })

        return { dayId: day.id, date: day.date }
      } catch (error) {
        if (isUniqueViolation(error, DAY_DATE_UNIQUE)) {
          throw new AppError('The event already has a day on this date', AppErrorCode.Conflict)
        }
        throw error
      }
    })
  }

  /**
   * Hard-deletes one of the current event's days. Its activities go with it,
   * by the FK's cascade. A day of another event reads as missing.
   */
  async deleteDay(dayId: string): Promise<DeleteScheduleDayResult> {
    return this.#withCurrentEvent(async (event) => {
      const deleted = await this.#scheduleDayRepository.deleteDay(dayId, event.id)

      if (!deleted) {
        throw new AppError('Schedule day not found', AppErrorCode.NotFound)
      }

      return { dayId }
    })
  }
}
