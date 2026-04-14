import { useId } from 'react'

type RadioOption = {
  label: string
  value: string
}

type RadioGroupProps = {
  label: string
  description?: string
  options: RadioOption[]
  selected?: string
  onChange?: (value: string) => void
  variant?: 'inline' | 'stacked'
}

export function RadioGroup(props: RadioGroupProps) {
  const groupName = useId()

  return (
    <fieldset className="flex flex-col gap-3">
      <div>
        <legend className="text-sm font-semibold text-dark-brown">{props.label}</legend>
        {props.description && <p className="text-sm text-primary italic">{props.description}</p>}
      </div>
      <div className={props.variant === 'stacked' ? 'flex flex-col gap-2' : 'flex gap-4'}>
        {props.options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 text-sm text-dark-brown"
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={props.selected === option.value}
              onChange={() => props.onChange?.(option.value)}
              className="h-3.5 w-3.5 cursor-pointer appearance-none rounded-full border border-primary checked:border-4 checked:border-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
