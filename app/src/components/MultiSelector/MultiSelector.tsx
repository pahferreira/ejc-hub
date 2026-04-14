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
        <label className="mb-2 block text-sm font-semibold text-dark-brown">{props.label}</label>
      )}
      <Listbox value={props.selected} onChange={props.onChange} multiple disabled={disabled}>
        {({ open }) => (
          <div className="relative">
            <ListboxButton className="relative w-full cursor-pointer rounded-lg border border-primary bg-white py-2.5 pl-3 pr-10 text-left text-sm text-dark-brown transition-all focus:border-dark-brown focus:shadow-[1px_1px_1px_1px_var(--dark-brown)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
              <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                {definePlaceholderText(props.selected, placeholder)}
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
                <div className="border-b border-secondary p-2">
                  <input
                    type="text"
                    className="w-full rounded-md border border-primary px-3 py-2 text-sm text-dark-brown focus:border-dark-brown focus:outline-none"
                    placeholder="Search..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-3 text-center text-sm text-dark-brown">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <ListboxOption
                      key={option.value}
                      value={option}
                      className="relative cursor-pointer select-none rounded-md px-3 py-2.5 text-sm text-dark-brown transition-colors hover:bg-tertiary"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={verifyOptionsIsSelected(props.selected, option)}
                          className="h-4 w-4 cursor-pointer rounded border border-primary accent-primary"
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
