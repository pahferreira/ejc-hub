import type { AttendanceBand, AttendanceRate } from '../domain/attendance.types.ts'
import type { MeetingAttendanceStatus } from '../../../modules/meeting-attendance/domain/meeting-attendance-status.ts'

export type MemberAttendanceRecord = {
  /** The meeting's `held_on`, as `YYYY-MM-DD`. */
  heldOn: string
  status: MeetingAttendanceStatus
}

// The org runs in Brazil, so "the day someone joined" is a São Paulo calendar
// day. Reading it in UTC would push an evening join to the next day and drop a
// meeting held that same evening.
const JOIN_DAY_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Whether a meeting falls before a member joined the team, and so does not count
 * for them. A meeting held on the join day itself counts.
 *
 * `joinedAt` is the team membership's `created_at`.
 */
export function isHeldBeforeJoin(heldOn: string, joinedAt: Date): boolean {
  // `en-CA` formats as YYYY-MM-DD, so the two compare as strings.
  return heldOn < JOIN_DAY_FORMAT.format(joinedAt)
}

/**
 * One member's rate: present ÷ (meetings since joining − justified).
 *
 * `records` are the member's attendance rows on their current team, each with
 * its meeting's date. Rows from before the join date are skipped here rather
 * than by the caller, so pro-rating lives in one place.
 */
export function toMemberAttendanceRate(
  joinedAt: Date,
  records: MemberAttendanceRecord[]
): AttendanceRate {
  return toPooledAttendanceRate(
    records
      .filter((record) => !isHeldBeforeJoin(record.heldOn, joinedAt))
      .map((record) => record.status)
  )
}

/**
 * A rate over a pool of attendance rows: present ÷ (rows − justified).
 *
 * The per-meeting rate passes one meeting's rows, and the team's Média passes
 * every row of every meeting. Pooling is deliberate: the Média is not the mean of
 * the members' percentages, so a newcomer's 1/1 weighs one row, not one person.
 * No pro-rating here: a meeting only holds rows for who was on the roster.
 */
export function toPooledAttendanceRate(statuses: MeetingAttendanceStatus[]): AttendanceRate {
  const present = statuses.filter((status) => status === 'present').length
  const justified = statuses.filter((status) => status === 'justified').length
  const eligible = statuses.length - justified

  if (eligible === 0) {
    return { present, eligible, justified, percentage: null, band: 'no-meetings' }
  }

  const exact = (present / eligible) * 100

  // The band reads the exact ratio, so 49.9% is still needs-replacement. The
  // percentage is rounded for display only, which means 74.5–74.9% shows as
  // "75%" in the risky tone.
  return {
    present,
    eligible,
    justified,
    percentage: Math.round(exact),
    band: toBand(exact, eligible),
  }
}

// One or two meetings say too little to judge a newcomer by.
const MIN_ELIGIBLE_FOR_BAND = 3
const GOOD_FROM_PERCENTAGE = 75
const RISKY_FROM_PERCENTAGE = 50

// Lower bounds are inclusive: exactly 75 is good, exactly 50 is risky.
function toBand(percentage: number, eligible: number): AttendanceBand {
  if (eligible < MIN_ELIGIBLE_FOR_BAND) {
    return 'insufficient-data'
  }

  if (percentage >= GOOD_FROM_PERCENTAGE) {
    return 'good'
  }

  if (percentage >= RISKY_FROM_PERCENTAGE) {
    return 'risky'
  }

  return 'needs-replacement'
}
