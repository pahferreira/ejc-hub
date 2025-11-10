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
}

function generateRandomPastelColor() {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 70
  const lightness = 60
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

export function TeamBox(props: TeamBoxProps) {
  const [internalSelected, setInternalSelected] = useState<boolean>(props.defaultSelected ?? false)
  const isSelected = props.selected ?? internalSelected
  const dotColor = useMemo(() => generateRandomPastelColor(), [])

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
        'disabled:opacity-60 disabled:cursor-not-allowed',
        isSelected ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300',
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
