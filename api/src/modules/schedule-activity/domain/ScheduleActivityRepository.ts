import type { DbExecutor } from '../../../core/database/client.ts'
import type { ScheduleActivityModel } from '../../../core/database/schemas/index.ts'

export type InsertScheduleActivityInput = {
  dayId: string
  eventId: string
  title: string
  /** An instant; stored as `timestamptz`. */
  plannedStartsAt: Date
  durationMinutes: number
  place: string
  guestName: string | null
  adminsResponsible: boolean
}

export interface ScheduleActivityRepository {
  /**
   * Every activity of one event across all its days, earliest planned start
   * first. Used both to render the schedule and to check a new activity for
   * overlaps, including across a day boundary.
   */
  listActivitiesByEvent: (eventId: string) => Promise<ScheduleActivityModel[]>

  /**
   * Inserts an activity. Accepts an executor so it can share the transaction
   * that also writes the activity's teams.
   */
  insertActivity: (
    input: InsertScheduleActivityInput,
    executor?: DbExecutor
  ) => Promise<ScheduleActivityModel>
}
