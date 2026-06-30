import clsx from 'clsx'

export type StatChipVariant = 'default' | 'waiting'

export type StatChipProps = {
  /** Muted descriptor shown before the value (e.g. "Atribuídos"). */
  label: string
  /** Emphasised numeric value. */
  value: number
  /** Surface accent. Default 'default'; 'waiting' highlights the waiting list. */
  variant?: StatChipVariant
}

const surfaceByVariant: Record<StatChipVariant, string> = {
  default: 'border-tertiary bg-white text-dark-brown',
  waiting: 'border-orange bg-orange/10 text-orange',
}

export function StatChip(props: StatChipProps) {
  const variant = props.variant ?? 'default'

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
        surfaceByVariant[variant]
      )}
    >
      <span className="font-medium opacity-80">{props.label}</span>
      <span className="font-semibold">{props.value}</span>
    </span>
  )
}
