import { Fragment } from 'react'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { FiCheck, FiChevronDown } from 'react-icons/fi'

export type Option = {
  label: string
  value: string
}

type SelectorProps = {
  options: Option[]
  selected?: Option
  onChange: (selected: Option) => void
  placeholder?: string
  label?: string
  disabled?: boolean
}

export function Selector(props: SelectorProps) {
  const { placeholder = 'Select an option...' } = props

  return (
    <div className="w-full">
      {props.label && (
        <label className="mb-2 block text-sm font-semibold text-dark-brown">{props.label}</label>
      )}
      <Listbox value={props.selected} onChange={props.onChange} disabled={props.disabled}>
        {({ open }) => (
          <div className="relative">
            <ListboxButton className="relative w-full cursor-pointer rounded-lg border border-primary bg-white py-2.5 pl-3 pr-10 text-left text-sm text-dark-brown transition-all focus:border-dark-brown focus:shadow-[1px_1px_1px_1px_var(--dark-brown)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
              <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                {props.selected ? props.selected.label : placeholder}
              </span>
              <FiChevronDown
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-brown pointer-events-none transition-transform duration-200 ${
                  open ? 'rotate-180' : ''
                }`}
              />
            </ListboxButton>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-primary bg-white p-1 shadow-lg focus:outline-none">
                {props.options.map((option) => (
                  <ListboxOption
                    key={option.value}
                    value={option}
                    className="relative cursor-pointer select-none rounded-md px-3 py-2.5 text-sm text-dark-brown transition-colors hover:bg-tertiary"
                  >
                    {({ selected }) => (
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {selected && <FiCheck className="h-4 w-4 text-primary" />}
                      </div>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        )}
      </Listbox>
    </div>
  )
}
