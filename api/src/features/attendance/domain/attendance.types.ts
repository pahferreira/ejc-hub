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
