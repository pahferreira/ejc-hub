import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import { toEventDate } from '../../../../../common/schedule/toEventDate.ts'
import type { ScheduleEvent } from '../domain/schedule.types.ts'

/**
 * The event's name and its São Paulo start and end dates.
 *
 * `starts_at`/`ends_at` are plain `timestamp` columns read as UTC instants, so
 * an event ending at 23:00 on a Sunday is already Monday in UTC. Reading them in
 * São Paulo is what keeps that Sunday the last day.
 */
export function toScheduleEvent(event: EventModel): ScheduleEvent {
  return {
    name: event.name,
    startDate: event.startsAt ? toEventDate(event.startsAt) : null,
    endDate: event.endsAt ? toEventDate(event.endsAt) : null,
  }
}

/** Refuses a day date outside the event's São Paulo dates, or any date when it has none. */
export function assertDateInEvent(event: EventModel, date: string): void {
  const { startDate, endDate } = toScheduleEvent(event)

  if (!startDate || !endDate) {
    throw new AppError('The current event has no dates set', AppErrorCode.Validation)
  }

  // `YYYY-MM-DD` strings compare as days.
  if (date < startDate || date > endDate) {
    throw new AppError('The date is outside the event dates', AppErrorCode.Validation)
  }
}
