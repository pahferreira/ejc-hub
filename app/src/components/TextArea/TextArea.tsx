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
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={props.name} className="font-semibold text-sm text-gray-700">
        {`${props.label}${props.isRequired ? '*' : ''}`}
      </label>
      <textarea
        name={props.name}
        required={props.isRequired}
        className={`border py-2 px-3 rounded ${props.error ? 'border-red-400' : 'border-gray-400'} text-md text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-500 resize-none`}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange?.(event.target.value)}
        rows={props.rows ?? 4}
      />
      {props.error && <p className="text-sm text-red-500">{props.error}</p>}
    </div>
  )
}
