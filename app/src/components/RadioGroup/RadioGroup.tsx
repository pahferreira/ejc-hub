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
        <legend className="font-semibold text-sm text-gray-700">{props.label}</legend>
        {props.description && <p className="text-sm text-gray-500">{props.description}</p>}
      </div>
      <div className={props.variant === 'stacked' ? 'flex flex-col gap-2' : 'flex gap-4'}>
        {props.options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={props.selected === option.value}
              onChange={() => props.onChange?.(option.value)}
              className="h-4 w-4 border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
