import { clsx } from 'clsx'

type CheckboxProps = {
  label: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  error?: boolean
  /**
   * Keeps the label as the accessible name but hides it visually. For dense
   * layouts (e.g. a table's selection column) where the surrounding row already
   * says who the checkbox belongs to.
   */
  hideLabel?: boolean
}

export function Checkbox(props: CheckboxProps) {
  return (
    <label
      className={clsx(
        'flex cursor-pointer select-none items-center gap-2 text-sm text-dark-brown',
        props.disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <input
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(event) => props.onChange?.(event.target.checked)}
        className={clsx(
          'h-4 w-4 cursor-pointer rounded border accent-primary disabled:cursor-not-allowed',
          props.error ? 'border-red' : 'border-primary'
        )}
      />
      {props.hideLabel ? <span className="sr-only">{props.label}</span> : props.label}
    </label>
  )
}
