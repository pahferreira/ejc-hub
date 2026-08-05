import clsx from 'clsx'
import { FiPlus, FiX } from 'react-icons/fi'
import { UserAvatar } from '../UserAvatar/UserAvatar'

const MAX_SLOTS = 3

export type SelectedCoordinator = {
  id: string
  name: string
  nickname: string
  /** Profile photo URL; falls back to initials when absent or broken. */
  pictureUrl?: string | null
}

export type CoordinatorSlotsProps = {
  /** Selected coordinators (0–3), a flat peer set — no rank or leader. */
  selected: SelectedCoordinator[]
  /** Remove a coordinator from the selection. */
  onRemove: (id: string) => void
}

export function CoordinatorSlots(props: CoordinatorSlotsProps) {
  const slotsUsed = Math.min(props.selected.length, MAX_SLOTS)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-dark-brown/70">
          Coordenação da equipe
        </span>
        <span className="text-xs font-semibold tabular-nums text-dark-brown/60">
          {slotsUsed} de {MAX_SLOTS}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: MAX_SLOTS }).map((_, index) => {
          const coordinator = props.selected[index]

          if (!coordinator) {
            return (
              <div
                key={index}
                aria-label="Vaga de coordenador"
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-dark-brown/25 px-2 py-4"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-dark-brown/25 text-dark-brown/40"
                >
                  <FiPlus size={18} />
                </span>
                <span className="text-center text-xs leading-tight text-dark-brown/50">
                  Vaga de coordenador
                </span>
              </div>
            )
          }

          return (
            <div
              key={index}
              className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl border border-tertiary bg-white px-2 py-4"
            >
              <button
                type="button"
                onClick={() => props.onRemove(coordinator.id)}
                aria-label={`Remover ${coordinator.name}`}
                className={clsx(
                  'absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full',
                  'text-dark-brown/40 transition-colors hover:bg-tertiary hover:text-dark-brown hover:cursor-pointer'
                )}
              >
                <FiX size={14} aria-hidden="true" />
              </button>

              <UserAvatar
                name={coordinator.name}
                pictureUrl={coordinator.pictureUrl}
                size="default"
              />
              <span className="max-w-full truncate text-center text-sm font-semibold text-dark-brown">
                {coordinator.nickname}
              </span>
              <span className="max-w-full truncate text-center text-xs text-dark-brown/50">
                {coordinator.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
