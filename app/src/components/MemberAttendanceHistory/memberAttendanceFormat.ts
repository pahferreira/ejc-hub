import type { BadgeVariant } from '../Badge/Badge'
import type {
  AttendanceRate,
  MeetingAttendanceStatus,
} from '../../services/attendance/attendance.types'
import { formatRateFraction } from '../AttendanceRate/attendanceRate'

export type StatusBadge = { label: string; variant: BadgeVariant }

const STATUS_BADGES: Record<MeetingAttendanceStatus, StatusBadge> = {
  present: { label: 'Presente', variant: 'success' },
  absent: { label: 'Ausente', variant: 'error' },
  justified: { label: 'Justificada', variant: 'info' },
}

/** The member's own status on a meeting, as the Histórico de presença badge shows it. */
export function statusToBadge(status: MeetingAttendanceStatus): StatusBadge {
  return STATUS_BADGES[status]
}

/**
 * The `EQUIPE` column: `12/15 · 80%`, or `—` when every row was justified.
 *
 * Not `formatRatePrimary`: its `poucos dados` caveat is about judging one
 * person, and a meeting's pooled rate is not a judgement of anyone.
 */
export function formatTeamMeetingRate(rate: AttendanceRate): string {
  if (rate.percentage === null) {
    return '—'
  }

  return `${formatRateFraction(rate)} · ${rate.percentage}%`
}
