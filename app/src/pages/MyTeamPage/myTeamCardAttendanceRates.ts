import type {
  AttendanceRate,
  CoordinatorAttendanceReadModel,
  MemberAttendanceReadModel,
} from '../../services/attendance/attendance.types'

export type MyTeamCardAttendanceRatesInput = {
  /** `GET /attendance/my-team`, read only by a coordinator. */
  teamModel?: CoordinatorAttendanceReadModel
  /** `GET /attendance/me`, read only by a member. */
  myModel?: MemberAttendanceReadModel
  /** The signed-in user's id: a member's rate goes on their own card only. */
  currentUserId?: string
}

/**
 * The Presença rate for each My Team card, keyed by user id. A coordinator
 * gets the whole roster; a member gets their own card and nobody else's.
 * Undefined when nothing was read, so the cards render no block at all.
 */
export function myTeamCardAttendanceRates(
  input: MyTeamCardAttendanceRatesInput
): Record<string, AttendanceRate> | undefined {
  if (input.teamModel) {
    return Object.fromEntries(input.teamModel.roster.map((person) => [person.userId, person.rate]))
  }

  if (input.myModel && input.currentUserId) {
    return { [input.currentUserId]: input.myModel.rate }
  }

  return undefined
}
