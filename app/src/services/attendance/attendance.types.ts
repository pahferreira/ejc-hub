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

/** What `POST /attendance/meetings` answers with: the counts the PostHog event reports. */
export type RegisterMeetingResult = {
  meetingId: string
  attendeeCount: number
  justifiedCount: number
}

export const attendanceQueryKeys = {
  all: ['attendance'] as const,
  myTeam: ['attendance', 'my-team'] as const,
}
