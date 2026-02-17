import { clsx } from 'clsx'

type CheckboxProps = {
  label: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export function Checkbox(props: CheckboxProps) {
  return (
    <label
      className={clsx(
        'flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700',
        props.disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(event) => props.onChange?.(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
      />
      {props.label}
    </label>
  )
}
