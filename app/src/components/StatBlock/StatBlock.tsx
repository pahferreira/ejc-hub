export type StatBlockProps = {
  /** The emphasised stat shown big. */
  value: string | number
  /** Muted label shown below the value. */
  label: string
}

export function StatBlock(props: StatBlockProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-serif text-2xl font-semibold text-dark-brown">{props.value}</span>
      <span className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
        {props.label}
      </span>
    </div>
  )
}
