import { formatMeetingWeekday } from '../../utils/attendanceDate/attendanceDate'
import { formatJustified } from '../AttendanceRate/attendanceRate'
import type { AttendanceMeeting } from '../../services/attendance/attendance.types'

/** How many meetings in the list share a held-on date. */
export function countMeetingsOnDate(
  meetings: Pick<AttendanceMeeting, 'heldOn'>[],
  heldOn: string
): number {
  return meetings.filter((meeting) => meeting.heldOn === heldOn).length
}

/**
 * The dot-separated parts under a meeting's title: the weekday, then
 * `N reuniões no dia` when the date is shared, then `N justificadas` when any.
 */
export function meetingSublineParts(
  meeting: Pick<AttendanceMeeting, 'heldOn' | 'rate'>,
  meetingsOnDate: number
): string[] {
  const parts = [formatMeetingWeekday(meeting.heldOn)]

  if (meetingsOnDate > 1) {
    parts.push(`${meetingsOnDate} reuniões no dia`)
  }

  const justified = formatJustified(meeting.rate.justified)
  if (justified) {
    parts.push(justified)
  }

  return parts
}
