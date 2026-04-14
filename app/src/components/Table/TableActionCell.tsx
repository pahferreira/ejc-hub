import { Fragment } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { FiMoreVertical } from 'react-icons/fi'

export type Action = {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}

type TableActionCellProps = {
  actions: Action[]
}

const variantStyles = {
  default: 'text-dark-brown hover:bg-tertiary',
  danger: 'text-red hover:bg-red/10',
}

function ActionButton(props: { action: Action }) {
  return (
    <button
      onClick={props.action.onClick}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-dark-brown bg-white px-3 py-2 text-sm font-medium text-dark-brown transition-colors hover:bg-tertiary focus:outline-none"
    >
      {props.action.label}
    </button>
  )
}

function ActionMenu(props: { actions: Action[] }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="inline-flex items-center justify-center rounded-lg p-2 text-dark-brown transition-colors hover:bg-tertiary focus:outline-none">
        <FiMoreVertical className="h-5 w-5" />
      </MenuButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-lg border border-primary bg-white shadow-lg focus:outline-none">
          <div className="py-1">
            {props.actions.map((action, index) => (
              <MenuItem key={index}>
                <button
                  onClick={action.onClick}
                  className={`block w-full px-4 py-2 text-left text-sm ${variantStyles[action.variant || 'default']}`}
                >
                  {action.label}
                </button>
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}

export function TableActionCell(props: TableActionCellProps) {
  const isSingleAction = props.actions.length === 1

  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
      {isSingleAction ? (
        <ActionButton action={props.actions[0]} />
      ) : (
        <ActionMenu actions={props.actions} />
      )}
    </td>
  )
}
