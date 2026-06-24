import clsx from 'clsx'
import { FiCheck } from 'react-icons/fi'

export type FilterCheckOption = {
  value: string
  label: string
}

export type FilterCheckProps = {
  label: string
  options: FilterCheckOption[]
  value: string[]
  onChange: (value: string[]) => void
  ariaLabel?: string
}

export function FilterCheck(props: FilterCheckProps) {
  const hasSelection = props.value.length > 0

  const toggle = (optionValue: string) => {
    const isSelected = props.value.includes(optionValue)
    const next = isSelected
      ? props.value.filter((current) => current !== optionValue)
      : [...props.value, optionValue]
    props.onChange(next)
  }

  return (
    <div
      role="group"
      aria-label={props.ariaLabel}
      className="inline-flex items-center gap-1 rounded-full border border-tertiary bg-white p-1"
    >
      <span className="px-2 text-xs font-semibold tracking-wide text-dark-brown uppercase">
        {props.label}
      </span>
      {props.options.map((option) => {
        const isActive = props.value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            aria-pressed={isActive}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:cursor-pointer',
              isActive
                ? 'bg-dark-brown text-white'
                : 'bg-transparent text-dark-brown hover:bg-secondary/50'
            )}
          >
            {isActive ? (
              <FiCheck
                aria-hidden="true"
                className="shrink-0 text-white"
                size={14}
                strokeWidth={3}
              />
            ) : (
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full border border-dark-brown/40"
              />
            )}
            {option.label}
          </button>
        )
      })}
      {hasSelection && (
        <button
          type="button"
          onClick={() => props.onChange([])}
          aria-label="Limpar seleção"
          className="ml-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-dark-brown transition-colors hover:cursor-pointer hover:bg-secondary/50"
        >
          <span aria-hidden="true" className="text-sm leading-none">
            ×
          </span>
        </button>
      )}
    </div>
  )
}
