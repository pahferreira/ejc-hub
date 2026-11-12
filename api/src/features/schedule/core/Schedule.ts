import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { runInTransaction } from '../../../core/database/client.ts'
import { isUniqueViolation } from '../../../shared/is-unique-violation.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { ScheduleDayRepository } from '../../../modules/schedule-day/domain/ScheduleDayRepository.ts'
import type {
  InsertScheduleActivityInput,
  ScheduleActivityRepository,
} from '../../../modules/schedule-activity/domain/ScheduleActivityRepository.ts'
import type { ScheduleActivityTeamRepository } from '../../../modules/schedule-activity-team/domain/ScheduleActivityTeamRepository.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import { SchedulePermissions } from '../../../../../common/permissions/permissions.types.ts'
import { hasPermission } from '../../../../../common/permissions/helpers/hasPermission.ts'
import { toEventInstant } from '../../../../../common/schedule/toEventInstant.ts'
import { daysBetween } from '../../../../../common/schedule/daysBetween.ts'
import { shiftByEventDays } from '../../../../../common/schedule/shiftByEventDays.ts'
import { teamColorToken } from '../../../../../common/schedule/teamColorToken.ts'
import { overlapsAny } from '../helpers/activity-interval.ts'
import { toScheduleEvent } from '../helpers/schedule-event.ts'
import type {
  CreateScheduleActivityInput,
  CreateScheduleActivityResult,
  CreateScheduleDayInput,
  CreateScheduleDayResult,
  DeleteScheduleActivityResult,
  DeleteScheduleDayResult,
  ScheduleActivity,
  ScheduleActivityPlan,
  ScheduleReadModel,
  ScheduleViewer,
  UpdateScheduleActivityInput,
  UpdateScheduleActivityResult,
  UpdateScheduleDayInput,
  UpdateScheduleDayResult,
} from '../domain/schedule.types.ts'

const DAY_DATE_UNIQUE = 'schedule_days_event_id_date_unique'
const DAY_DATE_TAKEN = 'The event already has a day on this date'

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
  #userRepository: UserRepository
  #teamMembershipRepository: TeamMembershipRepository

  constructor(
    eventRepo: EventRepository,
    scheduleDayRepo: ScheduleDayRepository,
    scheduleActivityRepo: ScheduleActivityRepository,
    scheduleActivityTeamRepo: ScheduleActivityTeamRepository,
    teamInstanceRepo: TeamInstanceRepository,
    userRepo: UserRepository,
    teamMembershipRepo: TeamMembershipRepository
  ) {
    this.#eventRepository = eventRepo
    this.#scheduleDayRepository = scheduleDayRepo
    this.#scheduleActivityRepository = scheduleActivityRepo
    this.#scheduleActivityTeamRepository = scheduleActivityTeamRepo
    this.#teamInstanceRepository = teamInstanceRepo
    this.#userRepository = userRepo
    this.#teamMembershipRepository = teamMembershipRepo
  }

  // Resolves the current event once per call and hands it to `fn`.
  async #withCurrentEvent<T>(fn: (event: EventModel) => Promise<T>): Promise<T> {
    const currentEvent = await this.#eventRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set', AppErrorCode.NoCurrentEvent)
    }

    return fn(currentEvent)
  }

  /** Refuses a day date outside the event's São Paulo dates, or any date when it has none. */
  #assertDateInEvent(event: EventModel, date: string): void {
    const { startDate, endDate } = toScheduleEvent(event)

    if (!startDate || !endDate) {
      throw new AppError('The current event has no dates set', AppErrorCode.Validation)
    }

    // `YYYY-MM-DD` strings compare as days.
    if (date < startDate || date > endDate) {
      throw new AppError('The date is outside the event dates', AppErrorCode.Validation)
    }
  }

  /**
   * Refuses a day date outside the event (400) or one another day already has
   * (409). `dayId` is the day taking the date, which may keep its own.
   */
  async #assertDayDateAvailable(event: EventModel, date: string, dayId?: string): Promise<void> {
    this.#assertDateInEvent(event, date)

    const existing = await this.#scheduleDayRepository.findDayByDate(event.id, date)

    if (existing && existing.id !== dayId) {
      throw new AppError(DAY_DATE_TAKEN, AppErrorCode.Conflict)
    }
  }

  /**
   * Runs a write that sets a day's date, turning the `unique(event_id, date)`
   * violation into the same 409 the read gives. The constraint is what catches
   * two admins taking the same date at once.
   */
  async #withDayDateUnique<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write()
    } catch (error) {
      if (isUniqueViolation(error, DAY_DATE_UNIQUE)) {
        throw new AppError(DAY_DATE_TAKEN, AppErrorCode.Conflict)
      }
      throw error
    }
  }

  /**
   * The viewer's team in the current event and the role they read the
   * Cronograma in, both from their one membership. The team role wins: an admin
   * who is on a team reads it as that team does. An admin on no team gets a null
   * team. Anyone else gets a 403: being on a team is data the token cannot
   * express, so the route lets every signed-in caller through and this decides.
   */
  async #resolveViewerTeam(
    viewer: ScheduleViewer,
    eventId: string
  ): Promise<Pick<ScheduleReadModel, 'myTeamInstanceId' | 'viewerRole'>> {
    const user = await this.#userRepository.getUser(viewer.authId)
    const membership = user
      ? await this.#teamMembershipRepository.findMembershipByUserAndEvent(user.id, eventId)
      : undefined

    if (membership) {
      return { myTeamInstanceId: membership.teamInstanceId, viewerRole: membership.type }
    }

    if (hasPermission(viewer.permissions, SchedulePermissions.Read)) {
      return { myTeamInstanceId: null, viewerRole: 'admin' }
    }

    throw new AppError(
      'Only an admin or a team member of the current event can read the schedule',
      AppErrorCode.Forbidden
    )
  }

  /**
   * The current event's days, earliest date first, each with its activities,
   * plus the viewer's own team so the Cronograma can highlight its activities,
   * and the role they read it in.
   */
  async getSchedule(viewer: ScheduleViewer): Promise<ScheduleReadModel> {
    return this.#withCurrentEvent(async (event) => {
      const viewerTeam = await this.#resolveViewerTeam(viewer, event.id)

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
          allTeams: activity.allTeams,
          teams: teamsByActivity.get(activity.id) ?? [],
        })
        activitiesByDay.set(activity.dayId, dayActivities)
      }

      return {
        event: toScheduleEvent(event),
        ...viewerTeam,
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
      await this.#assertDayDateAvailable(event, input.date)

      const day = await this.#withDayDateUnique(() =>
        this.#scheduleDayRepository.insertDay({ eventId: event.id, date: input.date })
      )

      return { dayId: day.id, date: day.date }
    })
  }

  /**
   * Every planning rule an activity must meet, checked before any write:
   *
   * - the day must belong to the current event;
   * - the start must be at or after the day's São Paulo 00:00;
   * - all teams never comes with picked teams;
   * - someone must be responsible (a team, all teams, a guest or the admins);
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

    // `allTeams` is a live wildcard over every team of the event, so picked
    // teams with it are a contradiction, refused rather than resolved.
    if (input.allTeams && hasTeams) {
      throw new AppError('All teams cannot be combined with picked teams', AppErrorCode.Validation)
    }

    if (!hasTeams && !input.allTeams && !input.guestName && !input.adminsResponsible) {
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
    // Accepted race: two admins writing overlapping activities at once both pass
    // this read, and no constraint catches it.
    const existing = await this.#scheduleActivityRepository.listActivitiesByEvent(event.id)
    const others = existing.filter((other) => other.id !== editedActivityId)

    if (overlapsAny({ plannedStartsAt: start, durationMinutes: input.durationMinutes }, others)) {
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
      allTeams: input.allTeams,
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
   * Moves one of the current event's days to another date. Every activity on
   * it shifts by the same whole number of days and keeps its São Paulo time of
   * day. The day and its activities move in one transaction.
   */
  async updateDay(dayId: string, input: UpdateScheduleDayInput): Promise<UpdateScheduleDayResult> {
    return this.#withCurrentEvent(async (event) => {
      const day = await this.#scheduleDayRepository.findDayById(dayId, event.id)

      if (!day) {
        throw new AppError('Schedule day not found', AppErrorCode.NotFound)
      }

      await this.#assertDayDateAvailable(event, input.date, day.id)

      const shift = daysBetween(day.date, input.date)
      // Accepted race: an activity added to the day after this read stays on the
      // old date, and no constraint catches it.
      const activities = await this.#scheduleActivityRepository.listActivitiesByEvent(event.id)
      const moved = activities
        .filter((activity) => activity.dayId === day.id)
        .map((activity) => ({
          id: activity.id,
          plannedStartsAt: shiftByEventDays(activity.plannedStartsAt, shift),
          durationMinutes: activity.durationMinutes,
        }))

      // Checked against every other day's activities. Only the new neighbours can
      // be reached, so this catches a past-midnight overlap in either direction.
      const others = activities.filter((activity) => activity.dayId !== day.id)

      if (moved.some((activity) => overlapsAny(activity, others))) {
        throw new AppError(
          'An activity of the day overlaps one on the days around its new date',
          AppErrorCode.Validation
        )
      }

      await this.#withDayDateUnique(() =>
        runInTransaction(async (tx) => {
          const updated = await this.#scheduleDayRepository.updateDayDate(
            day.id,
            event.id,
            input.date,
            tx
          )

          // Deleted since the read: throwing rolls the transaction back.
          if (!updated) {
            throw new AppError('Schedule day not found', AppErrorCode.NotFound)
          }

          await this.#scheduleActivityRepository.updatePlannedStarts(
            event.id,
            moved.map(({ id, plannedStartsAt }) => ({ id, plannedStartsAt })),
            tx
          )
        })
      )

      return { dayId: day.id, date: input.date }
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
