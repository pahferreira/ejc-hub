import clsx from 'clsx'
import type { HTMLInputTypeAttribute } from 'react'

type InputType = Exclude<HTMLInputTypeAttribute, 'button' | 'checkbox' | 'radio'>

type InputProps = {
  label: string
  name: string
  placeholder?: string
  isRequired?: boolean
  value?: string
  onChange?: (value: string) => void
  error?: string
  type?: InputType
}

export function Input(props: InputProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={props.name} className="text-sm font-semibold text-dark-brown">
        {`${props.label}${props.isRequired ? '*' : ''}`}
      </label>
      <input
        name={props.name}
        required={props.isRequired}
        className={clsx(
          'w-full rounded-lg border bg-white px-3 py-2 text-black focus:outline-none',
          props.error
            ? 'border-red placeholder:text-red/80 focus:shadow-[1px_1px_1px_1px_var(--red)]'
            : 'border-primary focus:border-dark-brown focus:shadow-[1px_1px_1px_1px_var(--dark-brown)] placeholder:text-black/50'
        )}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange?.(event.target.value)}
        type={props.type}
      />
      {props.error && <p className="text-sm text-red">{props.error}</p>}
    </div>
  )
}
