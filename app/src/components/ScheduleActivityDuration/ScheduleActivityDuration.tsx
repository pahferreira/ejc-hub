import { formatDuration } from '../../utils/scheduleActivity/scheduleActivity'

export type ScheduleActivityDurationProps = {
  durationMinutes: number
  /** The trim set during the event, or null. */
  adjustedDurationMinutes: number | null
  className?: string
}

/**
 * An activity's duration: `45 min`, or, once trimmed (**Ajuste**), the planned
 * one struck through with the trimmed one next to it, `~~45 min~~ 30 min`.
 */
export function ScheduleActivityDuration(props: ScheduleActivityDurationProps) {
  if (props.adjustedDurationMinutes === null) {
    return <span className={props.className}>{formatDuration(props.durationMinutes)}</span>
  }

  return (
    <span className={props.className}>
      <s aria-label={`Planejada: ${formatDuration(props.durationMinutes)}`} className="opacity-60">
        {formatDuration(props.durationMinutes)}
      </s>{' '}
      <span aria-label={`Ajustada: ${formatDuration(props.adjustedDurationMinutes)}`}>
        {formatDuration(props.adjustedDurationMinutes)}
      </span>
    </span>
  )
}
