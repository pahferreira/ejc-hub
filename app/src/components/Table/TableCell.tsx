import type { ReactNode } from 'react'

type TableCellProps = {
  children: ReactNode
  colSpan?: number
}

export function TableCell(props: TableCellProps) {
  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan={props.colSpan}>
      {props.children}
    </td>
  )
}
