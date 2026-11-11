import { MeetingAttendanceStatus } from '../../../modules/meeting-attendance/domain/meeting-attendance-status.ts'
import type { MeetingWriteResult, RegisterMeetingInput } from '../domain/attendance.types.ts'

type DerivedAttendance = {
  userId: string
  status: MeetingAttendanceStatus
  justificationReason: string | null
}

/**
 * One status per person in `userIds`: the ticked are `present`, the justified
 * carry their trimmed reason, and everyone else is `absent` (ADR 5).
 */
export function deriveAttendances(
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
export function meetingFields(input: RegisterMeetingInput) {
  return {
    heldOn: input.heldOn,
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
  }
}
