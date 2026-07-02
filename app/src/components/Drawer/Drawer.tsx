import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { FiX } from 'react-icons/fi'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  footer?: ReactNode
  children: ReactNode
}

export function Drawer(props: DrawerProps) {
  return (
    <Transition show={props.open} as={Fragment}>
      <Dialog onClose={props.onClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>

        {/* Drawer panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto flex w-screen max-w-lg flex-col bg-white shadow-xl border-t-primary border-t-4">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                      <DialogTitle className="m-0 text-sm font-semibold uppercase tracking-wider text-dark-brown">
                        {props.title}
                      </DialogTitle>
                      {props.subtitle && (
                        <p className="m-0 mt-1 text-xs text-dark-brown/60">{props.subtitle}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={props.onClose}
                      aria-label="Fechar"
                      className="ml-4 rounded-md text-dark-brown/60 hover:text-dark-brown focus:outline-none hover:cursor-pointer"
                    >
                      <FiX size={20} aria-hidden="true" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">{props.children}</div>

                  {/* Footer */}
                  {props.footer && (
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                      {props.footer}
                    </div>
                  )}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
