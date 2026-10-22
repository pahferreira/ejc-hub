import clsx from 'clsx'
import type { AttendanceRate } from '../../services/attendance/attendance.types'
import { bandToTextClass, formatJustified, formatRatePrimary } from './attendanceRate'

export type RateSummaryProps = {
  /** What precedes the rate, e.g. `Sua presença` or `Presença`. */
  label: string
  rate: AttendanceRate
  className?: string
}

/**
 * One person's rate as a single line: `Presença: 7/9 · 78% · 2 justificadas`.
 * The rate takes the band's tone; the justified count stays neutral.
 */
export function RateSummary(props: RateSummaryProps) {
  const justified = formatJustified(props.rate.justified)

  return (
    <p className={clsx('m-0 text-sm text-dark-brown/70', props.className)}>
      {props.label}:{' '}
      <span className={clsx('font-semibold', bandToTextClass(props.rate.band))}>
        {formatRatePrimary(props.rate)}
      </span>
      {justified && ` · ${justified}`}
    </p>
  )
}
