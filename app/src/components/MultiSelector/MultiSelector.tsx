import { useState, Fragment } from 'react'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { FiChevronDown } from 'react-icons/fi'

export type Option = {
  label: string
  value: string
}

export type MultiSelectorProps = {
  options: Option[]
  selected: Option[]
  onChange: (selected: Option[]) => void
  placeholder?: string
  label?: string
  disabled?: boolean
}

function verifyOptionsIsSelected(selectedOptions: Option[], option: Option) {
  return selectedOptions.some((item) => item.value === option.value)
}

function definePlaceholderText(selected: Option[], placeholder: string) {
  if (selected.length === 0) {
    return placeholder
  }
  if (selected.length === 1) {
    return selected[0].label
  }
  return `${selected.length} selected`
}

export function MultiSelector(props: MultiSelectorProps) {
  const { placeholder = 'Select options...', disabled = false } = props
  const [searchValue, setSearchValue] = useState('')

  const filteredOptions =
    searchValue === ''
      ? props.options
      : props.options.filter((option) =>
          option.label.toLowerCase().includes(searchValue.toLowerCase())
        )

  return (
    <div className="w-full max-w-xs">
      {props.label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">{props.label}</label>
      )}
      <Listbox value={props.selected} onChange={props.onChange} multiple disabled={disabled}>
        {({ open }) => (
          <div className="relative">
            <ListboxButton className="relative w-full cursor-pointer bg-white border border-gray-300 rounded-lg py-2.5 pl-3 pr-10 text-left text-sm transition-all hover:border-gray-400 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                {definePlaceholderText(props.selected, placeholder)}
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
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Search..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredOptions.length === 0 ? (
                  <div className="py-3 px-3 text-center text-gray-600 text-sm">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <ListboxOption
                      key={option.value}
                      value={option}
                      className="relative cursor-pointer select-none py-2.5 px-3 rounded-md text-sm transition-colors hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={verifyOptionsIsSelected(props.selected, option)}
                          className="w-4 h-4 cursor-pointer accent-blue-500"
                        />
                        <span>{option.label}</span>
                      </div>
                    </ListboxOption>
                  ))
                )}
              </ListboxOptions>
            </Transition>
          </div>
        )}
      </Listbox>
    </div>
  )
}
