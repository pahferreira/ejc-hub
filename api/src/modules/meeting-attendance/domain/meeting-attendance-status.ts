/**
 * Every status an attendance row can hold.
 *
 * Mirrors the `meeting_attendance_status` enum exactly. There is no "unknown":
 * every roster member gets an explicit row, so absence is never implied by a
 * missing one (ADR 5).
 */
export const MEETING_ATTENDANCE_STATUSES = ['present', 'absent', 'justified'] as const

export type MeetingAttendanceStatus = (typeof MEETING_ATTENDANCE_STATUSES)[number]

export const MeetingAttendanceStatus = {
  Present: 'present',
  Absent: 'absent',
  // Left out of the rate's denominator, so it always carries a reason.
  Justified: 'justified',
} as const satisfies Record<string, MeetingAttendanceStatus>
