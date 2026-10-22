import clsx from 'clsx'
import { Meter } from '../Meter/Meter'
import { SituationBadge } from '../AttendanceRate/SituationBadge'
import {
  bandToMeterTone,
  bandToTextClass,
  formatJustified,
  formatRatePrimary,
  hasMeter,
} from '../AttendanceRate/attendanceRate'
import type { AttendanceRate } from '../../services/attendance/attendance.types'

export type PersonAttendanceBlockProps = {
  rate: AttendanceRate
  /** Accessible name for the Meter (e.g. "Presença de Ju"). */
  label: string
}

/**
 * The PersonCard's Presença block: a `PRESENÇA` header with the band badge, the
 * band-toned `9/9 · 100%` line with the justified count on its right, and a
 * Meter. With no eligible meetings it is just the italic
 * *Sem reuniões desde a entrada*.
 */
export function PersonAttendanceBlock(props: PersonAttendanceBlockProps) {
  const { rate } = props
  const justified = formatJustified(rate.justified)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider text-secondary-foreground">
          PRESENÇA
        </span>
        <SituationBadge band={rate.band} />
      </div>

      {hasMeter(rate) ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className={clsx('text-sm font-semibold', bandToTextClass(rate.band))}>
              {formatRatePrimary(rate)}
            </span>
            {justified && <span className="text-xs text-dark-brown/60">{justified}</span>}
          </div>
          <Meter
            percentage={rate.percentage ?? 0}
            tone={bandToMeterTone(rate.band)}
            label={props.label}
          />
        </>
      ) : (
        <span className="text-sm italic text-dark-brown/60">{formatRatePrimary(rate)}</span>
      )}
    </div>
  )
}
