import type { DbExecutor } from '../../../core/database/client.ts'
import type { MeetingAttendanceStatus } from './meeting-attendance-status.ts'

export type InsertMeetingAttendanceInput = {
  meetingId: string
  userId: string
  status: MeetingAttendanceStatus
  /** Required exactly when `status` is `justified`; the check constraint enforces it. */
  justificationReason?: string | null
}

export type UpdateMeetingAttendanceInput = {
  userId: string
  status: MeetingAttendanceStatus
  justificationReason?: string | null
}

/**
 * One attendance row, joined to its meeting's date and the person it names.
 *
 * The person comes from `users`, not `team_memberships`, so a row survives the
 * member's removal from the team and still renders with a name (ADR 5).
 */
export type MeetingAttendanceRow = {
  id: string
  meetingId: string
  /** The meeting's `held_on`, `YYYY-MM-DD`: what the rate pro-rates against. */
  heldOn: string
  userId: string
  name: string
  /** Raw column value; may be null, in which case the caller falls back. */
  nickname: string | null
  pictureUrl: string | null
  status: MeetingAttendanceStatus
  justificationReason: string | null
}

export interface MeetingAttendanceRepository {
  /**
   * Writes a meeting's attendance rows in one statement: one per roster member.
   *
   * Returns the new ids in insertion order. An empty input returns `[]` without
   * querying, since `insert ... values ()` is a syntax error.
   */
  insertAttendances: (
    inputs: InsertMeetingAttendanceInput[],
    executor?: DbExecutor
  ) => Promise<string[]>

  /** One meeting's rows, by person name. */
  listAttendancesByMeeting: (meetingId: string) => Promise<MeetingAttendanceRow[]>

  /**
   * Every row of every meeting one team has registered, in a single query.
   *
   * Feeds both the team's pooled Média and each member's rate, which is why each
   * row carries its meeting's date.
   */
  listAttendancesByTeamInstance: (teamInstanceId: string) => Promise<MeetingAttendanceRow[]>

  /**
   * Rewrites the status and reason of a meeting's **existing** rows.
   *
   * Never inserts: an edit doesn't add people who joined after registration.
   * A user with no row on the meeting is skipped. One statement for the batch.
   *
   * Returns the user ids actually written.
   */
  updateAttendanceStatuses: (
    meetingId: string,
    updates: UpdateMeetingAttendanceInput[],
    executor?: DbExecutor
  ) => Promise<string[]>
}
