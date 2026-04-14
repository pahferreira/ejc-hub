import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal(props: ModalProps) {
  return (
    <Transition show={props.open} as={Fragment}>
      <Dialog onClose={props.onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md rounded-lg bg-white shadow-xl border-t-primary border-t-6">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-lg font-semibold text-gray-900 m-0">
                  {props.title}
                </DialogTitle>
              </div>
              <div className="px-6 py-4">{props.children}</div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
