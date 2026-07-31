export type ProgressBarVariant = 'green' | 'red'

/** What to show on the right of the label: the raw fraction (default) or just the percentage. */
export type ProgressBarRightLabel = 'fraction' | 'percentage'

export type ProgressBarProps = {
  label: string
  value: number
  max: number
  variant?: ProgressBarVariant
  descriptionSuffix?: string
  /** Right-aligned label next to the title. Defaults to 'fraction' (`value/max`). */
  rightLabel?: ProgressBarRightLabel
  /** Whether to render the percentage line below the bar. Defaults to `true`. */
  showPercentageLine?: boolean
}

const fillClasses: Record<ProgressBarVariant, string> = {
  green: 'bg-green',
  red: 'bg-red',
}

export function ProgressBar(props: ProgressBarProps) {
  const variant = props.variant ?? 'green'
  const rightLabel = props.rightLabel ?? 'fraction'
  const showPercentageLine = props.showPercentageLine ?? true
  const percentage = props.max > 0 ? Math.round((props.value / props.max) * 100) : 0
  const width = Math.min(100, Math.max(0, percentage))

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm text-black">
        <span className="font-medium">{props.label}</span>
        <span className="font-medium tabular-nums">
          {rightLabel === 'percentage' ? `${percentage}%` : `${props.value}/${props.max}`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={props.label}
        aria-valuenow={props.value}
        aria-valuemin={0}
        aria-valuemax={props.max}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className={`h-full rounded-full transition-all ${fillClasses[variant]}`}
          style={{ width: `${width}%` }}
        />
      </div>
      {showPercentageLine && (
        <span className="text-xs text-gray-600">
          {percentage}%{props.descriptionSuffix}
        </span>
      )}
    </div>
  )
}
