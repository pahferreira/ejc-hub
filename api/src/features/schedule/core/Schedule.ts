import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { runInTransaction, type DbExecutor } from '../../../core/database/client.ts'
import { isUniqueViolation } from '../../../shared/is-unique-violation.ts'
import { isForeignKeyViolation } from '../../../shared/is-foreign-key-violation.ts'
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
import type { ScheduleActivityNoteRepository } from '../../../modules/schedule-activity-note/domain/ScheduleActivityNoteRepository.ts'
import { resolveNickname } from '../../../shared/resolve-nickname.ts'
import { SchedulePermissions } from '../../../../../common/permissions/permissions.types.ts'
import { hasPermission } from '../../../../../common/permissions/helpers/hasPermission.ts'
import { toEventInstant } from '../../../../../common/schedule/toEventInstant.ts'
import { daysBetween } from '../../../../../common/schedule/daysBetween.ts'
import { shiftByEventDays } from '../../../../../common/schedule/shiftByEventDays.ts'
import { teamColorToken } from '../../../../../common/schedule/teamColorToken.ts'
import { overlapsAny } from '../helpers/activity-interval.ts'
import { toScheduleEvent } from '../helpers/schedule-event.ts'
import { canReadNote, type NoteReader } from '../helpers/note-visibility.ts'
import type {
  CreateScheduleActivityInput,
  CreateScheduleActivityNoteInput,
  CreateScheduleActivityNoteResult,
  CreateScheduleActivityResult,
  CreateScheduleDayInput,
  CreateScheduleDayResult,
  DeleteScheduleActivityResult,
  DeleteScheduleDayResult,
  FinishScheduleActivityInput,
  FinishScheduleActivityResult,
  ScheduleActivity,
  ScheduleActivityNote,
  ScheduleActivityPlan,
  ScheduleReadModel,
  ScheduleViewer,
  StartScheduleActivityInput,
  StartScheduleActivityResult,
  UpdateScheduleActivityInput,
  UpdateScheduleActivityResult,
  UpdateScheduleDayInput,
  UpdateScheduleDayResult,
} from '../domain/schedule.types.ts'

const DAY_DATE_UNIQUE = 'schedule_days_event_id_date_unique'
const DAY_DATE_TAKEN = 'The event already has a day on this date'
const ONE_RUNNING_UNIQUE = 'schedule_activities_one_running_per_event_idx'
const SCHEDULE_CHANGED = 'The schedule changed since it was read'
const NOTE_ACTIVITY_FK = 'schedule_activity_notes_activity_id_schedule_activities_id_fk'

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
  #scheduleActivityNoteRepository: ScheduleActivityNoteRepository

  constructor(
    eventRepo: EventRepository,
    scheduleDayRepo: ScheduleDayRepository,
    scheduleActivityRepo: ScheduleActivityRepository,
    scheduleActivityTeamRepo: ScheduleActivityTeamRepository,
    teamInstanceRepo: TeamInstanceRepository,
    userRepo: UserRepository,
    teamMembershipRepo: TeamMembershipRepository,
    scheduleActivityNoteRepo: ScheduleActivityNoteRepository
  ) {
    this.#eventRepository = eventRepo
    this.#scheduleDayRepository = scheduleDayRepo
    this.#scheduleActivityRepository = scheduleActivityRepo
    this.#scheduleActivityTeamRepository = scheduleActivityTeamRepo
    this.#teamInstanceRepository = teamInstanceRepo
    this.#userRepository = userRepo
    this.#teamMembershipRepository = teamMembershipRepo
    this.#scheduleActivityNoteRepository = scheduleActivityNoteRepo
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
   * Who the viewer reads notes as. Anyone who runs the clock reads as an admin,
   * even when on a team, so an admin always sees the notes they wrote. Everyone
   * else reads in the role `#resolveViewerTeam` gave them. A team role always
   * comes with a team; if it ever didn't, the read is refused rather than let
   * through as an admin.
   */
  #noteReader(
    viewer: ScheduleViewer,
    viewerTeam: Pick<ScheduleReadModel, 'myTeamInstanceId' | 'viewerRole'>
  ): NoteReader {
    if (
      hasPermission(viewer.permissions, SchedulePermissions.Control) ||
      viewerTeam.viewerRole === 'admin'
    ) {
      return { role: 'admin' }
    }

    if (!viewerTeam.myTeamInstanceId) {
      throw new AppError('A team role without a team cannot read notes', AppErrorCode.Forbidden)
    }

    return { role: viewerTeam.viewerRole, teamInstanceId: viewerTeam.myTeamInstanceId }
  }

  /**
   * The current event's days, earliest date first, each with its activities,
   * plus the viewer's own team so the Cronograma can highlight its activities,
   * and the role they read it in.
   */
  async getSchedule(viewer: ScheduleViewer): Promise<ScheduleReadModel> {
    return this.#withCurrentEvent(async (event) => {
      const viewerTeam = await this.#resolveViewerTeam(viewer, event.id)

      const [days, activities, teamRows, noteRows] = await Promise.all([
        this.#scheduleDayRepository.listDaysByEvent(event.id),
        this.#scheduleActivityRepository.listActivitiesByEvent(event.id),
        this.#scheduleActivityTeamRepository.listTeamsByEvent(event.id),
        this.#scheduleActivityNoteRepository.listNotesByEvent(event.id),
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

      // The notes this viewer reads, keyed by activity id, oldest first (the repo
      // orders). Admin notes follow the activity's teams as they are now.
      const reader = this.#noteReader(viewer, viewerTeam)
      const allTeamsByActivity = new Map(activities.map((a) => [a.id, a.allTeams]))
      const notesByActivity = new Map<string, ScheduleActivityNote[]>()
      for (const row of noteRows) {
        const activityTeams = {
          allTeams: allTeamsByActivity.get(row.activityId) ?? false,
          teamInstanceIds: (teamsByActivity.get(row.activityId) ?? []).map(
            (team) => team.teamInstanceId
          ),
        }

        if (!canReadNote(reader, row, activityTeams)) {
          continue
        }

        const notes = notesByActivity.get(row.activityId) ?? []
        notes.push({
          id: row.id,
          body: row.body,
          authorName: resolveNickname(row.authorName, row.authorNickname),
          authorRole: row.authorRole,
          createdAt: row.createdAt.toISOString(),
        })
        notesByActivity.set(row.activityId, notes)
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
          status: activity.status,
          actualStartedAt: activity.actualStartedAt?.toISOString() ?? null,
          actualEndedAt: activity.actualEndedAt?.toISOString() ?? null,
          adjustedDurationMinutes: activity.adjustedDurationMinutes,
          effectiveDurationMinutes: activity.adjustedDurationMinutes ?? activity.durationMinutes,
          notes: notesByActivity.get(activity.id) ?? [],
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
        serverNow: new Date().toISOString(),
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

  /**
   * The acting admin's user id, for `controlled_by`. Auth0 hands us a `sub`,
   * so it is resolved here; an admin with no user row is refused.
   */
  async #resolveControllerId(controllerAuthId: string): Promise<string> {
    const user = await this.#userRepository.getUser(controllerAuthId)

    if (!user) {
      throw new AppError('Only a registered user can run the schedule', AppErrorCode.Forbidden)
    }

    return user.id
  }

  /**
   * Starts the next planned activity of its day: the first `planned` one by
   * planned start. Whatever is running in the event finishes at the same
   * instant, in the same transaction, so one tap moves the day along.
   *
   * A stored status other than `expectedStatus` is a 409: another admin acted
   * first. A start that is out of order, or of an activity that isn't planned,
   * is a 400. The status-guarded writes and the one-running index catch a race
   * between the read and the writes as the same 409.
   */
  async startActivity(
    activityId: string,
    input: StartScheduleActivityInput
  ): Promise<StartScheduleActivityResult> {
    return this.#withCurrentEvent(async (event) => {
      const activities = await this.#scheduleActivityRepository.listActivitiesByEvent(event.id)
      const activity = activities.find((candidate) => candidate.id === activityId)

      if (!activity) {
        throw new AppError('Schedule activity not found', AppErrorCode.NotFound)
      }

      if (activity.status !== input.expectedStatus) {
        throw new AppError(SCHEDULE_CHANGED, AppErrorCode.Conflict)
      }

      if (activity.status !== 'planned') {
        throw new AppError('Only a planned activity can start', AppErrorCode.Validation)
      }

      // The repository orders by planned start, so the first planned one of the day is next.
      const next = activities.find(
        (candidate) => candidate.dayId === activity.dayId && candidate.status === 'planned'
      )

      if (next?.id !== activity.id) {
        throw new AppError(
          "Only the day's next planned activity can start",
          AppErrorCode.Validation
        )
      }

      const controlledBy = await this.#resolveControllerId(input.controllerAuthId)
      const running = activities.find((candidate) => candidate.status === 'running')
      const now = new Date()

      try {
        await runInTransaction(async (tx) => {
          if (running) {
            const finished = await this.#scheduleActivityRepository.transitionActivity(
              running.id,
              event.id,
              'running',
              { status: 'done', actualEndedAt: now, controlledBy },
              tx
            )

            if (!finished) {
              throw new AppError(SCHEDULE_CHANGED, AppErrorCode.Conflict)
            }
          }

          const started = await this.#scheduleActivityRepository.transitionActivity(
            activity.id,
            event.id,
            'planned',
            { status: 'running', actualStartedAt: now, controlledBy },
            tx
          )

          if (!started) {
            throw new AppError(SCHEDULE_CHANGED, AppErrorCode.Conflict)
          }
        })
      } catch (error) {
        // Another admin started an activity since the read.
        if (isUniqueViolation(error, ONE_RUNNING_UNIQUE)) {
          throw new AppError(SCHEDULE_CHANGED, AppErrorCode.Conflict)
        }
        throw error
      }

      return { activityId: activity.id, finishedActivityId: running?.id ?? null }
    })
  }

  /**
   * Finishes the running activity. It doesn't start the next one, so the
   * admins can take a break before it. Same 409 and 400 rules as a start.
   */
  async finishActivity(
    activityId: string,
    input: FinishScheduleActivityInput
  ): Promise<FinishScheduleActivityResult> {
    return this.#withCurrentEvent(async (event) => {
      const activity = await this.#scheduleActivityRepository.findActivityById(activityId, event.id)

      if (!activity) {
        throw new AppError('Schedule activity not found', AppErrorCode.NotFound)
      }

      if (activity.status !== input.expectedStatus) {
        throw new AppError(SCHEDULE_CHANGED, AppErrorCode.Conflict)
      }

      if (activity.status !== 'running') {
        throw new AppError('Only a running activity can finish', AppErrorCode.Validation)
      }

      const controlledBy = await this.#resolveControllerId(input.controllerAuthId)

      const finished = await this.#scheduleActivityRepository.transitionActivity(
        activity.id,
        event.id,
        'running',
        { status: 'done', actualEndedAt: new Date(), controlledBy }
      )

      // Finished by another admin since the read.
      if (!finished) {
        throw new AppError(SCHEDULE_CHANGED, AppErrorCode.Conflict)
      }

      return { activityId: activity.id }
    })
  }

  /**
   * Leaves a note on one of the current event's activities. Whoever runs the
   * clock (`schedule:control`) writes as an admin. Anyone else must coordinate a
   * team in the current event; the note keeps that team, so it still reaches the
   * same team if the coordinator moves. Members and outsiders are refused. The
   * coordinator check and the insert share one transaction.
   *
   * Accepted race: a coordinator removed between the check and the insert still
   * leaves the note; no constraint ties a note to a live membership.
   */
  async createNote(
    activityId: string,
    input: CreateScheduleActivityNoteInput
  ): Promise<CreateScheduleActivityNoteResult> {
    return this.#withCurrentEvent(async (event) => {
      const activity = await this.#scheduleActivityRepository.findActivityById(activityId, event.id)

      if (!activity) {
        throw new AppError('Schedule activity not found', AppErrorCode.NotFound)
      }

      const user = await this.#userRepository.getUser(input.authorAuthId)

      if (!user) {
        throw new AppError('Only a registered user can leave a note', AppErrorCode.Forbidden)
      }

      const isAdmin = hasPermission(input.permissions, SchedulePermissions.Control)

      try {
        const note = await runInTransaction(async (tx) => {
          const author = isAdmin
            ? { authorRole: 'admin' as const, teamInstanceId: null }
            : await this.#resolveCoordinatorAuthor(user.id, event.id, tx)

          return this.#scheduleActivityNoteRepository.insertNote(
            {
              activityId: activity.id,
              eventId: event.id,
              authorId: user.id,
              body: input.body,
              ...author,
            },
            tx
          )
        })

        return { noteId: note.id, activityId: activity.id }
      } catch (error) {
        // Deleted by an admin since the read: the activity FK refuses the insert.
        if (isForeignKeyViolation(error, NOTE_ACTIVITY_FK)) {
          throw new AppError('Schedule activity not found', AppErrorCode.NotFound)
        }

        throw error
      }
    })
  }

  /** A coordinator writes for their team in the event; anyone else is refused. */
  async #resolveCoordinatorAuthor(
    userId: string,
    eventId: string,
    executor: DbExecutor
  ): Promise<{ authorRole: 'coordinator'; teamInstanceId: string }> {
    const membership = await this.#teamMembershipRepository.findMembershipByUserAndEvent(
      userId,
      eventId,
      executor
    )

    if (membership?.type !== 'coordinator') {
      throw new AppError(
        'Only an admin or a coordinator of the current event can leave a note',
        AppErrorCode.Forbidden
      )
    }

    return { authorRole: 'coordinator', teamInstanceId: membership.teamInstanceId }
  }
}
