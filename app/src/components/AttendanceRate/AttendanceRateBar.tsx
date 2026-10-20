import clsx from 'clsx'
import { Meter } from '../Meter/Meter'
import type { AttendanceRate } from '../../services/attendance/attendance.types'
import { bandToMeterTone, formatJustified, formatRatePrimary, hasMeter } from './attendanceRate'

export type AttendanceRateBarProps = {
  rate: AttendanceRate
  /** Accessible name for the Meter (e.g. the person's or meeting's name). */
  label: string
  /** Right-aligns the stack, as the meeting row's rate is. */
  align?: 'left' | 'right'
  className?: string
}

/**
 * A rate as the app shows it everywhere: the `7/9 · 78%` line (or an edge-state
 * sentence), a band-toned Meter, and the justified count when there is one. The
 * band is read straight from the API, never recomputed.
 */
export function AttendanceRateBar(props: AttendanceRateBarProps) {
  const justified = formatJustified(props.rate.justified)
  const alignRight = props.align === 'right'

  return (
    <div
      className={clsx('flex flex-col gap-1', alignRight && 'items-end text-right', props.className)}
    >
      <span className="text-sm font-medium text-dark-brown">{formatRatePrimary(props.rate)}</span>
      {hasMeter(props.rate) && (
        <Meter
          percentage={props.rate.percentage ?? 0}
          tone={bandToMeterTone(props.rate.band)}
          label={props.label}
        />
      )}
      {justified && <span className="text-xs text-dark-brown/60">{justified}</span>}
    </div>
  )
}
