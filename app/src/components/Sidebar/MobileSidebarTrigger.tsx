import { FiMenu } from 'react-icons/fi'
import { Logo } from '../Logo/Logo'

type MobileSidebarTriggerProps = {
  isOpen: boolean
  onOpen: () => void
}

/**
 * Mobile-only top bar. On small screens the sidebar is an overlay with no
 * footprint in the layout, so this is the only way back into the navigation —
 * it stays pinned to the top of the page.
 */
export function MobileSidebarTrigger(props: MobileSidebarTriggerProps) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-secondary/30 bg-white px-4 py-3 md:hidden">
      <button
        type="button"
        onClick={props.onOpen}
        aria-label="Abrir menu"
        aria-expanded={props.isOpen}
        className="rounded-lg border-0 bg-transparent p-2 text-dark-brown transition-colors hover:bg-sidebar-highlight hover:cursor-pointer"
      >
        <FiMenu size={20} aria-hidden="true" />
      </button>
      <Logo />
    </div>
  )
}
