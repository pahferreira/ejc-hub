import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { isUniqueViolation } from '../../../shared/is-unique-violation.ts'
import { runInTransaction } from '../../../core/database/client.ts'
import type { EventModel, ScheduleActivityModel } from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { ScheduleDayRepository } from '../../../modules/schedule-day/domain/ScheduleDayRepository.ts'
import type {
  InsertScheduleActivityInput,
  ScheduleActivityRepository,
} from '../../../modules/schedule-activity/domain/ScheduleActivityRepository.ts'
import type { ScheduleActivityTeamRepository } from '../../../modules/schedule-activity-team/domain/ScheduleActivityTeamRepository.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import { toEventDate } from '../../../../../common/schedule/toEventDate.ts'
import { toEventInstant } from '../../../../../common/schedule/toEventInstant.ts'
import { teamColorToken } from '../../../../../common/schedule/teamColorToken.ts'
import { activityEnd, intervalsOverlap } from './activity-interval.ts'
import type {
  CreateScheduleActivityInput,
  CreateScheduleActivityResult,
  CreateScheduleDayInput,
  CreateScheduleDayResult,
  DeleteScheduleActivityResult,
  DeleteScheduleDayResult,
  ScheduleActivity,
  ScheduleActivityPlan,
  ScheduleEvent,
  ScheduleReadModel,
  UpdateScheduleActivityInput,
  UpdateScheduleActivityResult,
} from '../domain/schedule.types.ts'

const DAY_DATE_UNIQUE = 'schedule_days_event_id_date_unique'
const DAY_DATE_TAKEN = 'The event already has a day on this date'

/**
 * The event's name and its São Paulo start and end dates.
 *
 * `starts_at`/`ends_at` are plain `timestamp` columns read as UTC instants, so
 * an event ending at 23:00 on a Sunday is already Monday in UTC. Reading them in
 * São Paulo is what keeps that Sunday the last day.
 */
function toScheduleEvent(event: EventModel): ScheduleEvent {
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
  #scheduleActivityRepository: ScheduleActivityRepository
  #scheduleActivityTeamRepository: ScheduleActivityTeamRepository
  #teamInstanceRepository: TeamInstanceRepository

  constructor(
    eventRepo: EventRepository,
    scheduleDayRepo: ScheduleDayRepository,
    scheduleActivityRepo: ScheduleActivityRepository,
    scheduleActivityTeamRepo: ScheduleActivityTeamRepository,
    teamInstanceRepo: TeamInstanceRepository
  ) {
    this.#eventRepository = eventRepo
    this.#scheduleDayRepository = scheduleDayRepo
    this.#scheduleActivityRepository = scheduleActivityRepo
    this.#scheduleActivityTeamRepository = scheduleActivityTeamRepo
    this.#teamInstanceRepository = teamInstanceRepo
  }

  // Resolves the current event once per call and hands it to `fn`.
  async #withCurrentEvent<T>(fn: (event: EventModel) => Promise<T>): Promise<T> {
    const currentEvent = await this.#eventRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set', AppErrorCode.NoCurrentEvent)
    }

    return fn(currentEvent)
  }

  /** The current event's days, earliest date first, each with its activities. */
  async getSchedule(): Promise<ScheduleReadModel> {
    return this.#withCurrentEvent(async (event) => {
      const [days, activities, teamRows] = await Promise.all([
        this.#scheduleDayRepository.listDaysByEvent(event.id),
        this.#scheduleActivityRepository.listActivitiesByEvent(event.id),
        this.#scheduleActivityTeamRepository.listTeamsByEvent(event.id),
      ])

      // The teams of each activity, keyed by activity id, each with its circle color.
      const teamsByActivity = new Map<string, ScheduleActivity['teams']>()
      for (const row of teamRows) {
        const teams = teamsByActivity.get(row.activityId) ?? []
        teams.push({
          teamInstanceId: row.teamInstanceId,
          teamName: row.teamName,
          teamKey: row.teamKey,
          colorToken: teamColorToken(row.teamKey),
        })
        teamsByActivity.set(row.activityId, teams)
      }

      // The activities of each day, earliest planned start first (the repo orders).
      const activitiesByDay = new Map<string, ScheduleActivity[]>()
      for (const activity of activities) {
        const dayActivities = activitiesByDay.get(activity.dayId) ?? []
        dayActivities.push({
          id: activity.id,
          title: activity.title,
          plannedStartsAt: activity.plannedStartsAt.toISOString(),
          durationMinutes: activity.durationMinutes,
          place: activity.place,
          guestName: activity.guestName,
          adminsResponsible: activity.adminsResponsible,
          teams: teamsByActivity.get(activity.id) ?? [],
        })
        activitiesByDay.set(activity.dayId, dayActivities)
      }

      return {
        event: toScheduleEvent(event),
        days: days.map((day) => ({
          id: day.id,
          date: day.date,
          activityCount: day.activityCount,
          activities: activitiesByDay.get(day.id) ?? [],
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
      const { startDate, endDate } = toScheduleEvent(event)

      if (!startDate || !endDate) {
        throw new AppError('The current event has no dates set', AppErrorCode.Validation)
      }

      // `YYYY-MM-DD` strings compare as days.
      if (input.date < startDate || input.date > endDate) {
        throw new AppError('The date is outside the event dates', AppErrorCode.Validation)
      }

      const existing = await this.#scheduleDayRepository.findDayByDate(event.id, input.date)

      if (existing) {
        throw new AppError(DAY_DATE_TAKEN, AppErrorCode.Conflict)
      }

      try {
        const day = await this.#scheduleDayRepository.insertDay({
          eventId: event.id,
          date: input.date,
        })

        return { dayId: day.id, date: day.date }
      } catch (error) {
        if (isUniqueViolation(error, DAY_DATE_UNIQUE)) {
          throw new AppError(DAY_DATE_TAKEN, AppErrorCode.Conflict)
        }
        throw error
      }
    })
  }

  /**
   * Every planning rule an activity must meet, checked before any write:
   *
   * - the day must belong to the current event;
   * - the start must be at or after the day's São Paulo 00:00;
   * - someone must be responsible (a team, a guest or the admins);
   * - every team must belong to the current event;
   * - the activity must not overlap another on any day (touching edges are fine).
   *
   * An edit passes its own id so the activity is left out of its own overlap check.
   */
  async #checkActivityPlan(
    event: EventModel,
    input: ScheduleActivityPlan,
    editedActivityId?: string
  ): Promise<InsertScheduleActivityInput> {
    const day = await this.#scheduleDayRepository.findDayById(input.dayId, event.id)

    if (!day) {
      throw new AppError('Schedule day not found', AppErrorCode.NotFound)
    }

    const start = new Date(input.plannedStartsAt)

    if (Number.isNaN(start.getTime())) {
      throw new AppError('The planned start is not a valid instant', AppErrorCode.Validation)
    }

    if (input.durationMinutes <= 0) {
      throw new AppError('The duration must be greater than zero', AppErrorCode.Validation)
    }

    const hasTeams = input.teamInstanceIds.length > 0

    if (!hasTeams && !input.guestName && !input.adminsResponsible) {
      throw new AppError('The activity needs someone responsible', AppErrorCode.Validation)
    }

    // The day's 00:00 on the São Paulo clock. A start before it belongs to another day.
    const dayStart = toEventInstant(day.date, '00:00')

    if (start < dayStart) {
      throw new AppError("The planned start is before the day's start", AppErrorCode.Validation)
    }

    if (hasTeams) {
      const eventTeams = await this.#teamInstanceRepository.listTeamInstances(event.id)
      const eventTeamIds = new Set(eventTeams.map((team) => team.id))

      if (input.teamInstanceIds.some((id) => !eventTeamIds.has(id))) {
        throw new AppError('A team does not belong to the event', AppErrorCode.Validation)
      }
    }

    // Overlap is checked across the whole event, not just the day, so a last
    // activity that runs past midnight is caught against the next day's first.
    const end = activityEnd(start, input.durationMinutes)
    const existing = await this.#scheduleActivityRepository.listActivitiesByEvent(event.id)
    const overlaps = existing.some(
      (other: ScheduleActivityModel) =>
        other.id !== editedActivityId &&
        intervalsOverlap(
          start,
          end,
          other.plannedStartsAt,
          activityEnd(other.plannedStartsAt, other.durationMinutes)
        )
    )

    if (overlaps) {
      throw new AppError('The activity overlaps another one', AppErrorCode.Validation)
    }

    return {
      dayId: day.id,
      eventId: event.id,
      title: input.title,
      plannedStartsAt: start,
      durationMinutes: input.durationMinutes,
      place: input.place,
      guestName: input.guestName,
      adminsResponsible: input.adminsResponsible,
    }
  }

  /**
   * Adds an activity to a day of the current event, with its teams, in one
   * transaction, once it passes every planning rule (`#checkActivityPlan`).
   */
  async createActivity(input: CreateScheduleActivityInput): Promise<CreateScheduleActivityResult> {
    return this.#withCurrentEvent(async (event) => {
      const plan = await this.#checkActivityPlan(event, input)

      const activity = await runInTransaction(async (tx) => {
        const created = await this.#scheduleActivityRepository.insertActivity(plan, tx)

        await this.#scheduleActivityTeamRepository.insertTeams(
          created.id,
          input.teamInstanceIds,
          event.id,
          tx
        )

        return created
      })

      return { activityId: activity.id }
    })
  }

  /**
   * Edits any field of one of the current event's activities, teams included.
   * Every planning rule runs again, leaving the activity out of its own overlap
   * check; the activity and its whole team set are replaced in one transaction.
   */
  async updateActivity(
    activityId: string,
    input: UpdateScheduleActivityInput
  ): Promise<UpdateScheduleActivityResult> {
    return this.#withCurrentEvent(async (event) => {
      const existing = await this.#scheduleActivityRepository.findActivityById(activityId, event.id)

      if (!existing) {
        throw new AppError('Schedule activity not found', AppErrorCode.NotFound)
      }

      const plan = await this.#checkActivityPlan(event, input, activityId)

      await runInTransaction(async (tx) => {
        const updated = await this.#scheduleActivityRepository.updateActivity(
          activityId,
          event.id,
          plan,
          tx
        )

        // Deleted by another admin since the read: roll back before touching its teams.
        if (!updated) {
          throw new AppError('Schedule activity not found', AppErrorCode.NotFound)
        }

        await this.#scheduleActivityTeamRepository.replaceTeams(
          activityId,
          input.teamInstanceIds,
          event.id,
          tx
        )
      })

      return { activityId }
    })
  }

  /**
   * Hard-deletes one of the current event's activities with its team links. No
   * status guard in Phase 1. An activity of another event reads as missing.
   */
  async deleteActivity(activityId: string): Promise<DeleteScheduleActivityResult> {
    return this.#withCurrentEvent(async (event) => {
      const deleted = await this.#scheduleActivityRepository.deleteActivity(activityId, event.id)

      if (!deleted) {
        throw new AppError('Schedule activity not found', AppErrorCode.NotFound)
      }

      return { activityId }
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
