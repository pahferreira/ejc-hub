import { AppError } from '../../../shared/AppError.ts'
import { MeetingAttendanceStatus } from '../../../modules/meeting-attendance/domain/meeting-attendance-status.ts'
import type { MeetingWriteResult, RegisterMeetingInput } from '../domain/attendance.types.ts'

/**
 * Every rule a registration or an edit must pass, checked before anything is
 * written.
 *
 * `eligibleIds` is who may be listed: the current roster when registering, the
 * meeting's existing rows when editing. The drawer mirrors these, so a
 * rejection here means a stale form or a hand-built request rather than a typo
 * to explain.
 */
export function assertWritable(
  input: RegisterMeetingInput,
  eligibleIds: Set<string>,
  today: string
) {
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
