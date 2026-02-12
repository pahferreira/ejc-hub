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
  const { placeholder = 'Select an option...', disabled = false } = props

  return (
    <div className="w-full">
      {props.label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">{props.label}</label>
      )}
      <Listbox value={props.selected} onChange={props.onChange} disabled={disabled}>
        {({ open }) => (
          <div className="relative">
            <ListboxButton className="relative w-full cursor-pointer bg-white border border-gray-300 rounded-lg py-2.5 pl-3 pr-10 text-left text-sm transition-all hover:border-gray-400 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                {props.selected ? props.selected.label : placeholder}
              </span>
              <FiChevronDown
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none transition-transform duration-200 ${
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
              <ListboxOptions className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg p-1 focus:outline-none">
                {props.options.map((option) => (
                  <ListboxOption
                    key={option.value}
                    value={option}
                    className="relative cursor-pointer select-none py-2.5 px-3 rounded-md text-sm transition-colors hover:bg-gray-100"
                  >
                    {({ selected }) => (
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {selected && <FiCheck className="w-4 h-4 text-blue-500" />}
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
