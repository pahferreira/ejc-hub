import type { MeetingAttendanceStatus } from '../../../modules/meeting-attendance/domain/meeting-attendance-status.ts'

export type AttendanceBand =
  | 'good'
  | 'risky'
  | 'needs-replacement'
  | 'insufficient-data'
  | 'no-meetings'

/** The rate summary every attendance read model returns. Computed on read, never stored. */
export type AttendanceRate = {
  present: number
  /** Eligible meetings (or rows) minus the justified ones: the denominator. */
  eligible: number
  justified: number
  /** Whole percentage; null when `eligible` is 0. */
  percentage: number | null
  band: AttendanceBand
}

/** A person as any attendance surface renders them: avatar, nickname, full name. */
export type AttendancePerson = {
  userId: string
  name: string
  /** Resolved via `resolveNickname`, so always a word to show. */
  nickname: string
  pictureUrl: string | null
}

/** One roster member with their rate and the day they joined the team. */
export type AttendanceRosterMember = AttendancePerson & {
  type: 'member' | 'coordinator'
  /** The membership's `created_at`. The page shows `entrou em DD/MM` when it is after the first meeting. */
  joinedAt: Date
  rate: AttendanceRate
}

/** One attendance row on a meeting: who, their status and any justification. */
export type MeetingAttendanceEntry = AttendancePerson & {
  status: MeetingAttendanceStatus
  justificationReason: string | null
}

/** One meeting with its own pooled rate, its rows and whether it was edited. */
export type AttendanceMeeting = {
  id: string
  /** `YYYY-MM-DD`. */
  heldOn: string
  title: string | null
  description: string | null
  /** `updated_at > created_at`: the "editada" marker everyone sees. */
  edited: boolean
  rate: AttendanceRate
  attendances: MeetingAttendanceEntry[]
}

/** How many roster members fall in each band. */
export type AttendanceBandCounts = Record<AttendanceBand, number>

/** Everything the coordinator Reuniões page reads in one call. */
export type CoordinatorAttendanceReadModel = {
  teamInstanceId: string
  /** Pooled across every row of every meeting — never the mean of the members' percentages. */
  teamAverage: AttendanceRate
  meetingCount: number
  /** Every attendance row across every meeting: the `de N` the Justificadas chip divides by. */
  totalRows: number
  justifiedTotal: number
  bandCounts: AttendanceBandCounts
  roster: AttendanceRosterMember[]
  /** Most recently held first, matching the repository's order. */
  meetings: AttendanceMeeting[]
}

/**
 * One team meeting as the member Reuniões page shows it: the caller's own
 * status and the team's pooled rate, never anyone else's row.
 */
export type MemberAttendanceMeeting = {
  id: string
  /** `YYYY-MM-DD`. */
  heldOn: string
  title: string | null
  /** `updated_at > created_at`: the "editada" marker everyone sees. */
  edited: boolean
  /** The team's pooled rate on this meeting: an aggregate, no names. */
  teamRate: AttendanceRate
  /**
   * The meeting does not count for the caller: it was held before they joined,
   * or it was registered before they joined and so holds no row for them.
   */
  beforeJoin: boolean
  /** The caller's own status, or null when the meeting does not count for them. */
  status: MeetingAttendanceStatus | null
  /** Only when `status` is `justified`. */
  justificationReason: string | null
}

/** Everything the member Reuniões page reads in one call: their own record only. */
export type MemberAttendanceReadModel = {
  teamInstanceId: string
  /** The membership's `created_at`. */
  joinedAt: Date
  /** The caller's own rate, pro-rated from their join date. */
  rate: AttendanceRate
  /** Most recently held first, matching the repository's order. */
  meetings: MemberAttendanceMeeting[]
}

/** One justified absence: who, and why they could not come. */
export type JustifiedAbsenceInput = {
  userId: string
  reason: string
}

/**
 * Registering a meeting. No team: it is the caller's coordinated team.
 *
 * Only the ticked and the justified are sent; every other roster member is
 * stored as `absent` (ADR 5).
 */
export type RegisterMeetingInput = {
  /** `YYYY-MM-DD`, never after today in São Paulo. */
  heldOn: string
  title?: string
  description?: string
  presentUserIds: string[]
  justified: JustifiedAbsenceInput[]
}

/**
 * Editing a meeting: the same body as registering. The listed ids must already
 * have a row on the meeting; anyone else with a row becomes `absent`.
 */
export type UpdateMeetingInput = RegisterMeetingInput

/** What a register or an edit answers with: the counts the PostHog event reports. */
export type MeetingWriteResult = {
  meetingId: string
  attendeeCount: number
  justifiedCount: number
}

export type RegisterMeetingResult = MeetingWriteResult

export type DeleteMeetingResult = {
  meetingId: string
}
