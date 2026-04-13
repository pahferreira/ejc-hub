import clsx from 'clsx'

type TextAreaProps = {
  label: string
  name: string
  placeholder?: string
  isRequired?: boolean
  value?: string
  onChange?: (value: string) => void
  error?: string
  rows?: number
}

export function TextArea(props: TextAreaProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={props.name} className="text-sm font-semibold text-dark-brown">
        {`${props.label}${props.isRequired ? '*' : ''}`}
      </label>
      <textarea
        name={props.name}
        required={props.isRequired}
        className={clsx(
          'w-full resize-none rounded-lg border bg-white px-3 py-2 text-black placeholder:text-secondary focus:outline-none',
          props.error
            ? 'border-red focus:shadow-[1px_1px_1px_1px_var(--red)]'
            : 'border-primary focus:border-dark-brown focus:shadow-[1px_1px_1px_1px_var(--dark-brown)]'
        )}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange?.(event.target.value)}
        rows={props.rows ?? 4}
      />
      {props.error && <p className="text-sm text-red">{props.error}</p>}
    </div>
  )
}
