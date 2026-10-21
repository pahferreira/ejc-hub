import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { runInTransaction } from '../../../core/database/client.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { MeetingRepository } from '../../../modules/meeting/domain/MeetingRepository.ts'
import type { MeetingAttendanceRepository } from '../../../modules/meeting-attendance/domain/MeetingAttendanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import { MeetingAttendanceStatus } from '../../../modules/meeting-attendance/domain/meeting-attendance-status.ts'
import type { InsertMeetingAttendanceInput } from '../../../modules/meeting-attendance/domain/MeetingAttendanceRepository.ts'
import type {
  CoordinatorAttendanceReadModel,
  DeleteMeetingResult,
  MeetingWriteResult,
  RegisterMeetingInput,
  RegisterMeetingResult,
  UpdateMeetingInput,
} from '../domain/attendance.types.ts'
import { buildCoordinatorReadModel } from './coordinator-read-model.ts'
import { toSaoPauloDay } from './attendance-rate.ts'

const COORDINATOR_TYPE = 'coordinator'

/**
 * Every rule a registration or an edit must pass, checked before anything is
 * written.
 *
 * `eligibleIds` is who may be listed: the current roster when registering, the
 * meeting's existing rows when editing. The drawer mirrors these, so a
 * rejection here means a stale form or a hand-built request rather than a typo
 * to explain.
 */
function assertWritable(input: RegisterMeetingInput, eligibleIds: Set<string>, today: string) {
  // `YYYY-MM-DD` strings compare as days. "Today" is the org's São Paulo day.
  if (input.heldOn > today) {
    throw new AppError('A meeting cannot be held in the future')
  }

  const listedIds = [...input.presentUserIds, ...input.justified.map((entry) => entry.userId)]

  // One status per row: a person listed twice, in either list or across both,
  // would have two answers for one meeting.
  if (new Set(listedIds).size !== listedIds.length) {
    throw new AppError('A person can be listed only once, as present or as justified')
  }

  if (listedIds.some((userId) => !eligibleIds.has(userId))) {
    throw new AppError('Every listed person must be on the meeting roster')
  }

  // The check constraint would refuse it too, but as a 500 mid-transaction.
  if (input.justified.some((entry) => entry.reason.trim() === '')) {
    throw new AppError('A justified absence needs a reason')
  }
}

type DerivedAttendance = {
  userId: string
  status: MeetingAttendanceStatus
  justificationReason: string | null
}

/**
 * One status per person in `userIds`: the ticked are `present`, the justified
 * carry their trimmed reason, and everyone else is `absent` (ADR 5).
 */
function deriveAttendances(
  input: RegisterMeetingInput,
  userIds: string[]
): { rows: DerivedAttendance[]; result: Omit<MeetingWriteResult, 'meetingId'> } {
  const presentIds = new Set(input.presentUserIds)
  const reasonByUser = new Map(input.justified.map((entry) => [entry.userId, entry.reason.trim()]))

  const rows = userIds.map((userId) => {
    const reason = reasonByUser.get(userId)
    const status = presentIds.has(userId)
      ? MeetingAttendanceStatus.Present
      : reason !== undefined
        ? MeetingAttendanceStatus.Justified
        : MeetingAttendanceStatus.Absent

    return {
      userId,
      status,
      justificationReason: status === MeetingAttendanceStatus.Justified ? (reason ?? null) : null,
    }
  })

  return {
    rows,
    result: { attendeeCount: presentIds.size, justifiedCount: reasonByUser.size },
  }
}

// The meeting's own columns from the input: its date, and its text with blanks stored as null.
function meetingFields(input: RegisterMeetingInput) {
  return {
    heldOn: input.heldOn,
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
  }
}

/**
 * The single entry point for attendance reads and writes.
 *
 * Repositories are injected so the core logic can be unit-tested with stubs. The
 * coordinator read is **auth-only**: the team is derived from the caller's own
 * coordinator membership, never passed in, following the member-request precedent.
 */
export class Attendance {
  #eventRepository: EventRepository
  #userRepository: UserRepository
  #teamMembershipRepository: TeamMembershipRepository
  #meetingRepository: MeetingRepository
  #meetingAttendanceRepository: MeetingAttendanceRepository

  constructor(
    eventRepo: EventRepository,
    userRepo: UserRepository,
    teamMembershipRepo: TeamMembershipRepository,
    meetingRepo: MeetingRepository,
    meetingAttendanceRepo: MeetingAttendanceRepository
  ) {
    this.#eventRepository = eventRepo
    this.#userRepository = userRepo
    this.#teamMembershipRepository = teamMembershipRepo
    this.#meetingRepository = meetingRepo
    this.#meetingAttendanceRepository = meetingAttendanceRepo
  }

  // Resolves the current event once per call and hands it to `fn`.
  async #withCurrentEvent<T>(fn: (event: EventModel) => Promise<T>): Promise<T> {
    const currentEvent = await this.#eventRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    return fn(currentEvent)
  }

  // Auth0 hands us a `sub`, not our own user id, so resolve it before touching
  // membership data.
  async #resolveActor(actorAuthId: string) {
    const actor = await this.#userRepository.getUser(actorAuthId)

    if (!actor) {
      throw new AppError('User not found')
    }

    return actor
  }

  /**
   * The team the caller coordinates, or a 403.
   *
   * A user holds at most one membership per event, so the coordinator's team is
   * derived rather than passed in — which makes "coordinator reads another team's
   * attendance" unrepresentable rather than something to guard against.
   */
  async #resolveCoordinatedTeam(actorUserId: string, eventId: string): Promise<string> {
    const membership = await this.#teamMembershipRepository.findMembershipByUserAndEvent(
      actorUserId,
      eventId
    )

    if (!membership || membership.type !== COORDINATOR_TYPE) {
      throw new AppError(
        'Only a team coordinator can read their team attendance',
        AppErrorCode.Forbidden
      )
    }

    return membership.teamInstanceId
  }

  /**
   * The coordinator Reuniões read model for the caller's own team.
   *
   * One read of the roster, the meetings and every attendance row, folded into
   * the pooled Média, the band counts, the roster rates and the per-meeting rows.
   */
  async getMyTeamReadModel(actorAuthId: string): Promise<CoordinatorAttendanceReadModel> {
    return this.#withCurrentEvent(async (event) => {
      const actor = await this.#resolveActor(actorAuthId)
      const teamInstanceId = await this.#resolveCoordinatedTeam(actor.id, event.id)

      const [roster, meetings, attendanceRows] = await Promise.all([
        this.#teamMembershipRepository.listRosterByTeamInstance(teamInstanceId),
        this.#meetingRepository.listMeetingsByTeamInstance(teamInstanceId),
        this.#meetingAttendanceRepository.listAttendancesByTeamInstance(teamInstanceId),
      ])

      return buildCoordinatorReadModel({
        teamInstanceId,
        roster,
        meetings,
        attendanceRows,
      })
    })
  }

  /**
   * Registers a meeting on the caller's own team.
   *
   * Writes the meeting plus **one row per current roster member** in one
   * transaction: the ticked are `present`, the justified carry their reason,
   * and everyone else is `absent` — absence is never implied by a missing row
   * (ADR 5). Two meetings on the same day are allowed.
   */
  async registerMeeting(
    actorAuthId: string,
    input: RegisterMeetingInput
  ): Promise<RegisterMeetingResult> {
    return this.#withCurrentEvent(async (event) => {
      const actor = await this.#resolveActor(actorAuthId)
      const teamInstanceId = await this.#resolveCoordinatedTeam(actor.id, event.id)
      const roster = await this.#teamMembershipRepository.listRosterByTeamInstance(teamInstanceId)

      // Every read and every throw is above the transaction; it holds writes only.
      assertWritable(
        input,
        new Set(roster.map((member) => member.userId)),
        toSaoPauloDay(new Date())
      )

      const { rows, result } = deriveAttendances(
        input,
        roster.map((member) => member.userId)
      )

      return runInTransaction(async (tx) => {
        const meeting = await this.#meetingRepository.insertMeeting(
          { teamInstanceId, ...meetingFields(input), createdBy: actor.id },
          tx
        )

        const inserts: InsertMeetingAttendanceInput[] = rows.map((row) => ({
          meetingId: meeting.id,
          ...row,
        }))

        await this.#meetingAttendanceRepository.insertAttendances(inserts, tx)

        return { meetingId: meeting.id, ...result }
      })
    })
  }

  /**
   * A meeting on the team the caller coordinates, or a 403.
   *
   * "No such meeting" and "another team's meeting" are the same `Forbidden`
   * with the same message, following `assertCoordinatorCanCancel`: a distinct
   * not-found would let a coordinator probe which meeting ids exist elsewhere.
   * Team instances are per event, so this also fences off past events.
   */
  async #resolveOwnMeeting(actorAuthId: string, eventId: string, meetingId: string) {
    const actor = await this.#resolveActor(actorAuthId)
    const teamInstanceId = await this.#resolveCoordinatedTeam(actor.id, eventId)
    const meeting = await this.#meetingRepository.getMeeting(meetingId)

    if (!meeting || meeting.teamInstanceId !== teamInstanceId) {
      throw new AppError(
        'Cannot change a meeting that does not belong to your team',
        AppErrorCode.Forbidden
      )
    }

    return meeting
  }

  /**
   * Edits a meeting on the caller's own team: its date, text and statuses.
   *
   * Rewrites the meeting's **existing rows only**. Someone who joined after
   * registration has no row and gets none; someone removed since keeps theirs
   * and can still be corrected. Stamping `updated_at` is what marks it
   * "editada".
   */
  async updateMeeting(
    actorAuthId: string,
    meetingId: string,
    input: UpdateMeetingInput
  ): Promise<MeetingWriteResult> {
    return this.#withCurrentEvent(async (event) => {
      await this.#resolveOwnMeeting(actorAuthId, event.id, meetingId)

      const existingRows =
        await this.#meetingAttendanceRepository.listAttendancesByMeeting(meetingId)
      const rowUserIds = existingRows.map((row) => row.userId)

      assertWritable(input, new Set(rowUserIds), toSaoPauloDay(new Date()))

      const { rows, result } = deriveAttendances(input, rowUserIds)

      return runInTransaction(async (tx) => {
        await this.#meetingRepository.updateMeeting(meetingId, meetingFields(input), tx)
        await this.#meetingAttendanceRepository.updateAttendanceStatuses(meetingId, rows, tx)

        return { meetingId, ...result }
      })
    })
  }

  /**
   * Hard-deletes a meeting on the caller's own team. Its rows go with it by the
   * FK's cascade, so it drops out of every rate at once.
   */
  async deleteMeeting(actorAuthId: string, meetingId: string): Promise<DeleteMeetingResult> {
    return this.#withCurrentEvent(async (event) => {
      await this.#resolveOwnMeeting(actorAuthId, event.id, meetingId)

      await this.#meetingRepository.deleteMeeting(meetingId)

      return { meetingId }
    })
  }
}
