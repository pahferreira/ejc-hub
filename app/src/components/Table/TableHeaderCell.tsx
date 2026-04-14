import type { ReactNode } from 'react'

type TableHeaderCellProps = {
  children: ReactNode
}

export function TableHeaderCell(props: TableHeaderCellProps) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dark-brown">
      {props.children}
    </th>
  )
}
