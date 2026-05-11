export type CoordinatorRowProps = {
  name: string
  phone: string | null
}

function getInitial(name: string) {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : '?'
}

export function CoordinatorRow(props: CoordinatorRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-tertiary-background px-3 py-2">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark-brown text-sm font-semibold text-white"
        aria-hidden
      >
        {getInitial(props.name)}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-black">{props.name}</span>
        {props.phone && (
          <a
            href={`tel:${props.phone}`}
            className="truncate text-xs text-black no-underline hover:underline"
          >
            {props.phone}
          </a>
        )}
      </div>
    </div>
  )
}
