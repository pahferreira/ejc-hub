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
  allTeams: boolean
}

export type UpdatePlannedStartInput = {
  id: string
  plannedStartsAt: Date
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

  /** One activity of an event, or undefined when it is missing or another event's. */
  findActivityById: (id: string, eventId: string) => Promise<ScheduleActivityModel | undefined>

  /**
   * Overwrites an activity's fields. Accepts an executor so it shares the
   * transaction that also replaces the activity's teams.
   */
  updateActivity: (
    id: string,
    eventId: string,
    input: Omit<InsertScheduleActivityInput, 'eventId'>,
    executor?: DbExecutor
  ) => Promise<ScheduleActivityModel | undefined>

  /**
   * Hard-deletes one of an event's activities; its team links go with it by the
   * FK's cascade. Returns the deleted row, or undefined when there was none.
   */
  deleteActivity: (id: string, eventId: string) => Promise<ScheduleActivityModel | undefined>

  /**
   * Sets the planned start of each given activity of the event. Accepts an
   * executor so it can share the transaction that also moves the activities' day.
   */
  updatePlannedStarts: (
    eventId: string,
    updates: UpdatePlannedStartInput[],
    executor?: DbExecutor
  ) => Promise<void>
}
