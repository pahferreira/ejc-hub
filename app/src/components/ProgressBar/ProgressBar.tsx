export type ProgressBarVariant = 'green' | 'red'

export type ProgressBarProps = {
  label: string
  value: number
  max: number
  variant?: ProgressBarVariant
  descriptionSuffix?: string
}

const fillClasses: Record<ProgressBarVariant, string> = {
  green: 'bg-green',
  red: 'bg-red',
}

export function ProgressBar(props: ProgressBarProps) {
  const variant = props.variant ?? 'green'
  const percentage = props.max > 0 ? Math.round((props.value / props.max) * 100) : 0
  const width = Math.min(100, Math.max(0, percentage))

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm text-black">
        <span className="font-medium">{props.label}</span>
        <span className="font-medium tabular-nums">
          {props.value}/{props.max}
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
      <span className="text-xs text-gray-600">
        {percentage}%{props.descriptionSuffix}
      </span>
    </div>
  )
}
