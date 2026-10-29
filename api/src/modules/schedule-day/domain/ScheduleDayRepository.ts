import type { DbExecutor } from '../../../core/database/client.ts'
import type { ScheduleDayModel } from '../../../core/database/schemas/index.ts'

export type InsertScheduleDayInput = {
  eventId: string
  /** `YYYY-MM-DD`, a São Paulo date. */
  date: string
}

/** A day with how many activities it holds, for the planning tabs. */
export type ScheduleDayWithActivityCount = ScheduleDayModel & {
  activityCount: number
}

export interface ScheduleDayRepository {
  /** Every day of one event, earliest date first, each with its activity count. */
  listDaysByEvent: (eventId: string) => Promise<ScheduleDayWithActivityCount[]>

  /** The event's day on that date, or `undefined` when it has none. */
  findDayByDate: (eventId: string, date: string) => Promise<ScheduleDayModel | undefined>

  /**
   * Inserts a day. A second day on the same date in the event is refused by
   * `schedule_days_event_id_date_unique`.
   */
  insertDay: (input: InsertScheduleDayInput, executor?: DbExecutor) => Promise<ScheduleDayModel>

  /**
   * Hard-deletes one of the event's days. Its activities go with it, by the FK's cascade.
   *
   * Returns the deleted row, or `undefined` when the id names no day of that event.
   */
  deleteDay: (
    id: string,
    eventId: string,
    executor?: DbExecutor
  ) => Promise<ScheduleDayModel | undefined>
}
