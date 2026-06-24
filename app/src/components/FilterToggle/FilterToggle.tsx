import clsx from 'clsx'

export type FilterToggleOption = {
  value: string
  label: string
}

export type FilterToggleProps = {
  options: FilterToggleOption[]
  value: string
  onChange: (value: string) => void
  ariaLabel?: string
}

export function FilterToggle(props: FilterToggleProps) {
  return (
    <div
      role="group"
      aria-label={props.ariaLabel}
      className="inline-flex items-center gap-1 rounded-full border border-tertiary bg-white p-1"
    >
      {props.options.map((option) => {
        const isActive = option.value === props.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => props.onChange(option.value)}
            aria-pressed={isActive}
            className={clsx(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:cursor-pointer',
              isActive
                ? 'bg-dark-brown text-white'
                : 'bg-transparent text-dark-brown hover:bg-secondary/50'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
