import { useMemo, useState } from 'react'

export type TeamBoxProps = {
  /** Team name */
  title: string
  /** Team description */
  description?: string
  /** Controlled selected state */
  selected?: boolean
  /** Uncontrolled initial selected state */
  defaultSelected?: boolean
  /** Disable interaction and apply muted styles */
  disabled?: boolean
  /** Callback when selection toggles */
  onToggle?: (selected?: boolean) => void
  /** Display error state */
  error?: boolean
}

const BROWN_COLORS = [
  '#2e1602',
  '#612c02',
  '#763d0e',
  '#8b4513',
  '#d5a67b',
  '#e0b993',
  '#e6c5a5',
  '#ecd1b5',
  '#f2dcc4',
]

function selectRandomColor() {
  const randomIndex = Math.floor(Math.random() * BROWN_COLORS.length)
  const color = BROWN_COLORS[randomIndex]
  return color
}

export function TeamBox(props: TeamBoxProps) {
  const [internalSelected, setInternalSelected] = useState<boolean>(props.defaultSelected ?? false)
  const isSelected = props.selected ?? internalSelected
  const dotColor = useMemo(() => selectRandomColor(), [])

  const handleClick = () => {
    setInternalSelected((prevState) => {
      const newState = !prevState
      props.onToggle?.(newState)
      return newState
    })
  }

  return (
    <button
      type="button"
      role="checkbox"
      onClick={handleClick}
      disabled={props.disabled}
      value="test"
      className={[
        'w-full flex items-start gap-3 rounded-md bg-white p-4 text-left shadow border transition-colors cursor-pointer',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-gray-300 focus-visible:outline-none',
        isSelected
          ? 'shadow-[1px_1px_1px_1px_var(--dark-brown)]'
          : 'border-gray-300 hover:border-dark-brown',
        props.error && 'border-red hover:border-red-300',
      ].join(' ')}
    >
      <span
        aria-hidden
        className="mt-1 h-3 w-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-gray-900">{props.title}</span>
        {props.description && <span className="text-xs text-gray-500">{props.description}</span>}
      </span>
    </button>
  )
}
