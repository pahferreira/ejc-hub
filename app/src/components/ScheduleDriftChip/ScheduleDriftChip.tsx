import clsx from 'clsx'
import type { DriftTone } from '../../utils/scheduleClock/scheduleClock'
import { DRIFT_TONE_CHIP_CLASSES } from './driftToneClasses'

export type ScheduleDriftChipProps = {
  children: React.ReactNode
  /** Late reads red, early blue, on time green. */
  tone: DriftTone
}

/**
 * A drift on the Cronograma: the day's Atraso, an activity's "PREVISTO +7 min",
 * or an overrun's "+N min", colored by whether it is late, early or on time.
 */
export function ScheduleDriftChip(props: ScheduleDriftChipProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border bg-white px-2.5 py-0.5 text-xs font-bold tracking-wide',
        DRIFT_TONE_CHIP_CLASSES[props.tone]
      )}
    >
      {props.children}
    </span>
  )
}
