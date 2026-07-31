import clsx from 'clsx'
import { FiPlus } from 'react-icons/fi'

export type PersonCardEmptySlotProps = {
  /** Name of the team the open slot belongs to. */
  teamName: string
  /** Called when the slot is clicked. Renders a plain, non-interactive placeholder when absent. */
  onClick?: () => void
}

export function PersonCardEmptySlot(props: PersonCardEmptySlotProps) {
  const content = (
    <div
      className={clsx(
        'flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-dark-brown/25 px-6 py-8 text-center transition-colors',
        props.onClick && 'hover:border-dark-brown/50'
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-dark-brown/25 text-dark-brown/40"
      >
        <FiPlus size={18} />
      </span>
      <p className="m-0 text-sm text-dark-brown/50">
        Vaga de coordenador em aberto para {props.teamName}
      </p>
    </div>
  )

  if (!props.onClick) {
    return content
  }

  return (
    <button type="button" onClick={props.onClick} className="w-full hover:cursor-pointer">
      {content}
    </button>
  )
}
