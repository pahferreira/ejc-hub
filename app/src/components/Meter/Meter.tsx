import clsx from 'clsx'
import type { BadgeVariant } from '../Badge/Badge'

/**
 * Shares its vocabulary with `Badge` so a value's pill and its bar can be driven
 * by a single tone, and therefore cannot drift apart.
 */
export type MeterTone = Extract<BadgeVariant, 'default' | 'success' | 'warning' | 'error'>

export type MeterProps = {
  /** Progress from 0 to 100. Values outside the range are clamped. */
  percentage: number
  tone?: MeterTone
  /** Accessible name for the bar. Not rendered visually. */
  label: string
}

const fillClasses: Record<MeterTone, string> = {
  default: 'bg-dark-brown',
  success: 'bg-green',
  warning: 'bg-orange',
  error: 'bg-red',
}

export function Meter(props: MeterProps) {
  const tone = props.tone ?? 'default'
  const percentage = Number.isFinite(props.percentage) ? Math.round(props.percentage) : 0
  const width = Math.min(100, Math.max(0, percentage))

  return (
    <div
      role="progressbar"
      aria-label={props.label}
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
    >
      <div
        className={clsx('h-full rounded-full transition-all', fillClasses[tone])}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
