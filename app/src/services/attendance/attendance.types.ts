import type { TeamMembershipType } from '../teams/teams.types'

/** Mirrors the API's `AttendanceBand`. The app never recomputes it. */
export type AttendanceBand =
  | 'good'
  | 'risky'
  | 'needs-replacement'
  | 'insufficient-data'
  | 'no-meetings'

/** Mirrors the API's `MeetingAttendanceStatus`. */
export type MeetingAttendanceStatus = 'present' | 'absent' | 'justified'

/** Mirrors the API's `AttendanceRate`, computed on read and never stored. */
export type AttendanceRate = {
  present: number
  eligible: number
  justified: number
  /** Whole percentage; null when `eligible` is 0. */
  percentage: number | null
  band: AttendanceBand
}

export type AttendancePerson = {
  userId: string
  name: string
  nickname: string
  pictureUrl: string | null
}

export type AttendanceRosterMember = AttendancePerson & {
  type: TeamMembershipType
  /** ISO timestamp of the membership's creation: the day the person joined the team. */
  joinedAt: string
  rate: AttendanceRate
}

export type MeetingAttendanceEntry = AttendancePerson & {
  status: MeetingAttendanceStatus
  justificationReason: string | null
}

export type AttendanceMeeting = {
  id: string
  /** `YYYY-MM-DD`. */
  heldOn: string
  title: string | null
  description: string | null
  /** `updated_at > created_at`: shows the "editada" pill. */
  edited: boolean
  rate: AttendanceRate
  attendances: MeetingAttendanceEntry[]
}

export type AttendanceBandCounts = Record<AttendanceBand, number>

/** Everything the coordinator Reuniões page reads from `GET /attendance/my-team`. */
export type CoordinatorAttendanceReadModel = {
  teamInstanceId: string
  /** Pooled across every row of every meeting — not the mean of the members' percentages. */
  teamAverage: AttendanceRate
  meetingCount: number
  totalRows: number
  justifiedTotal: number
  bandCounts: AttendanceBandCounts
  roster: AttendanceRosterMember[]
  /** Most recently held first. */
  meetings: AttendanceMeeting[]
}

/** One team meeting on the member view: the caller's own status beside the team's rate. */
export type MemberAttendanceMeeting = {
  id: string
  /** `YYYY-MM-DD`. */
  heldOn: string
  title: string | null
  /** The team's pooled rate on this meeting: an aggregate, no names. */
  teamRate: AttendanceRate
  /** Held or registered before the caller joined: greyed out, does not count. */
  beforeJoin: boolean
  /** Null when `beforeJoin`. */
  status: MeetingAttendanceStatus | null
  justificationReason: string | null
}

/** The member Reuniões page from `GET /attendance/me`: the caller's own record only. */
export type MemberAttendanceReadModel = {
  teamInstanceId: string
  /** ISO timestamp of the membership's creation. */
  joinedAt: string
  /** The caller's own rate, pro-rated from their join date. */
  rate: AttendanceRate
  /** Most recently held first. */
  meetings: MemberAttendanceMeeting[]
}

/**
 * The `POST /attendance/meetings` body. No team: the API derives it from the
 * caller. Anyone on the roster not listed here is stored as absent.
 */
export type RegisterMeetingBody = {
  /** `YYYY-MM-DD`. */
  heldOn: string
  title?: string
  description?: string
  presentUserIds: string[]
  justified: Array<{ userId: string; reason: string }>
}

/**
 * The `PUT /attendance/meetings/:id` body: the same shape. Only the meeting's
 * existing rows can be listed; the API never adds a row on edit.
 */
export type UpdateMeetingBody = RegisterMeetingBody

/** What `POST /attendance/meetings` answers with: the counts the PostHog event reports. */
export type RegisterMeetingResult = {
  meetingId: string
  attendeeCount: number
  justifiedCount: number
}

export type UpdateMeetingResult = RegisterMeetingResult

export const attendanceQueryKeys = {
  all: ['attendance'] as const,
  myTeam: ['attendance', 'my-team'] as const,
  me: ['attendance', 'me'] as const,
  team: (teamInstanceId: string) => ['attendance', 'team', teamInstanceId] as const,
}
