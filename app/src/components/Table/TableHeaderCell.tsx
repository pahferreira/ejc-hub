import type { MouseEventHandler, ReactNode } from 'react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'

/** Mirrors the return type of TanStack's `column.getIsSorted()`. */
export type SortDirection = 'asc' | 'desc' | false

type TableHeaderCellProps = {
  children: ReactNode
  /**
   * Omit for a plain, non-sortable cell. Pass `false` for a sortable column
   * that is not currently the sort key.
   */
  sortDirection?: SortDirection
  onSort?: MouseEventHandler<HTMLButtonElement>
}

const cellClasses =
  'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dark-brown'

const ariaSortByDirection = {
  asc: 'ascending',
  desc: 'descending',
} as const

function SortIcon(props: { direction: SortDirection }) {
  if (props.direction === 'asc') {
    return <FiChevronUp size="14px" aria-hidden />
  }

  if (props.direction === 'desc') {
    return <FiChevronDown size="14px" aria-hidden />
  }

  return (
    <span className="flex flex-col leading-none opacity-40" aria-hidden>
      <FiChevronUp size="10px" />
      <FiChevronDown size="10px" className="-mt-0.5" />
    </span>
  )
}

export function TableHeaderCell(props: TableHeaderCellProps) {
  if (props.sortDirection === undefined) {
    return <th className={cellClasses}>{props.children}</th>
  }

  return (
    <th
      className={cellClasses}
      aria-sort={props.sortDirection ? ariaSortByDirection[props.sortDirection] : 'none'}
    >
      <button
        type="button"
        onClick={props.onSort}
        className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold uppercase tracking-wider text-inherit hover:text-primary"
      >
        {props.children}
        <SortIcon direction={props.sortDirection} />
      </button>
    </th>
  )
}
