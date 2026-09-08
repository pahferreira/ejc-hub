import { Fragment, useEffect, useRef } from 'react'
import { Transition } from '@headlessui/react'
import { Button } from '../Button/Button'
import { pluralize } from '../../utils/pluralize/pluralize'

export type FeeBulkSelectionBarProps = {
  selectedCount: number
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Floating confirmation bar for a bulk fee selection.
 *
 * Owns its own visibility (nothing is rendered at zero) so callers can mount it
 * unconditionally beside the members card and let the selection drive it.
 *
 * It is viewport-fixed, so it floats over whatever is beneath it: a page that
 * renders it must leave room at the bottom of its scroll container, since a
 * fixed element cannot reserve space for itself.
 */
export function FeeBulkSelectionBar(props: FeeBulkSelectionBarProps) {
  /**
   * The last count worth showing. While the bar animates out, `selectedCount`
   * is already 0 but the bar is still on screen, so rendering the live value
   * would flash "0 membros selecionados" on the way out.
   */
  const lastShownCount = useRef(props.selectedCount)

  useEffect(() => {
    if (props.selectedCount > 0) {
      lastShownCount.current = props.selectedCount
    }
  }, [props.selectedCount])

  const displayCount = props.selectedCount > 0 ? props.selectedCount : lastShownCount.current

  return (
    <Transition
      show={props.selectedCount > 0}
      as={Fragment}
      enter="transform transition ease-out duration-200"
      enterFrom="translate-y-2 opacity-0"
      enterTo="translate-y-0 opacity-100"
      leave="transform transition ease-in duration-150"
      leaveFrom="translate-y-0 opacity-100"
      leaveTo="translate-y-2 opacity-0"
    >
      <div
        role="status"
        // Padded past the home indicator on phones; `env()` resolves to 0 on
        // hardware that has none.
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        className="fixed inset-x-0 z-50 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-3 rounded-full bg-dark-brown px-4 py-3 text-white shadow-lg sm:gap-4"
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary-foreground font-semibold text-white">
            {displayCount}
          </span>
          <span className="text-sm">
            {pluralize(displayCount, 'membro selecionado', 'membros selecionados')}
          </span>
        </span>

        <span aria-hidden="true" className="hidden h-6 w-px bg-white/25 sm:block" />

        {/* A one-off ghost button: no text-only variant exists on `Button`, and
            growing a shared primitive for a single caller is the worse trade. */}
        <button
          type="button"
          onClick={props.onCancel}
          className="cursor-pointer rounded-lg px-2 py-1 text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          Cancelar
        </button>

        <Button variant="secondary" onClick={props.onConfirm}>
          <span className="inline-flex items-center gap-1.5">
            Confirmar {displayCount} {pluralize(displayCount, 'taxa', 'taxas')}
          </span>
        </Button>
      </div>
    </Transition>
  )
}
