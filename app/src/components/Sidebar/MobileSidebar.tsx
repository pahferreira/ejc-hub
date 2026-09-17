import { Fragment } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { FiX } from 'react-icons/fi'
import { SidebarContent } from './SidebarContent'
import type { SidebarNavProps } from './SidebarContent'

export type MobileSidebarProps = SidebarNavProps & {
  open: boolean
  onClose: () => void
}

/**
 * The sidebar as a left-anchored overlay for small screens: it floats above the
 * page instead of taking a column out of the layout.
 *
 * Built on the same Headless UI `Dialog` the `Drawer` and `Modal` primitives
 * use, which is what gives us the scrim, click-outside-to-close, `Escape`,
 * body scroll lock, focus trapping and `role="dialog"` for free.
 *
 * Staying closed on desktop is the caller's job, not a `md:hidden` class: a
 * hidden-but-open dialog would still hold the scroll lock and focus trap.
 */
export function MobileSidebar(props: MobileSidebarProps) {
  return (
    <Transition show={props.open} as={Fragment}>
      <Dialog onClose={props.onClose} className="relative z-50">
        {/* Backdrop — clicking it closes the menu */}
        <TransitionChild
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/50"
            aria-hidden="true"
            data-testid="mobile-sidebar-backdrop"
          />
        </TransitionChild>

        {/* Menu panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
            <TransitionChild
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <DialogPanel className="pointer-events-auto flex w-64 max-w-[calc(100vw-2.5rem)] flex-col bg-white shadow-xl">
                <DialogTitle className="sr-only">Menu de navegação</DialogTitle>
                {/* `bg-sidebar-background` is translucent, so it needs the white
                    panel underneath to match the desktop rail's tint. */}
                <div className="flex h-full flex-col overflow-hidden bg-sidebar-background">
                  <SidebarContent
                    groups={props.groups}
                    userName={props.userName}
                    userNickname={props.userNickname}
                    userPicture={props.userPicture}
                    onLogout={props.onLogout}
                    isCollapsed={false}
                    headerAction={
                      <button
                        type="button"
                        onClick={props.onClose}
                        aria-label="Fechar menu"
                        className="rounded-md border-0 bg-transparent p-1 text-dark-brown/60 hover:text-dark-brown focus:outline-none hover:cursor-pointer"
                      >
                        <FiX size={20} aria-hidden="true" />
                      </button>
                    }
                  />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
