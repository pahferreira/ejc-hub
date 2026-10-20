import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { MeetingRepository } from '../../../modules/meeting/domain/MeetingRepository.ts'
import type { MeetingAttendanceRepository } from '../../../modules/meeting-attendance/domain/MeetingAttendanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import type { CoordinatorAttendanceReadModel } from '../domain/attendance.types.ts'
import { buildCoordinatorReadModel } from './coordinator-read-model.ts'

const COORDINATOR_TYPE = 'coordinator'

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
}
