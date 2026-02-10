import type { ReactNode } from 'react'

type TableHeaderCellProps = {
  children: ReactNode
}

export function TableHeaderCell(props: TableHeaderCellProps) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {props.children}
    </th>
  )
}
