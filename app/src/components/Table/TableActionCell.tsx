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
  default: 'text-gray-700 hover:bg-gray-100',
  danger: 'text-red-600 hover:bg-red-50',
}

function ActionButton(props: { action: Action }) {
  return (
    <button
      onClick={props.action.onClick}
      className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 h-9 rounded-md px-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {props.action.label}
    </button>
  )
}

function ActionMenu(props: { actions: Action[] }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        <FiMoreVertical className="w-5 h-5 text-gray-500" />
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
        <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {props.actions.map((action, index) => (
              <MenuItem key={index}>
                <button
                  onClick={action.onClick}
                  className={`block w-full text-left px-4 py-2 text-sm ${variantStyles[action.variant || 'default']}`}
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
