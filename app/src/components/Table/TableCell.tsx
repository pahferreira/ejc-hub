import clsx from 'clsx'
import type { ReactNode } from 'react'

type TableCellProps = {
  children: ReactNode
  colSpan?: number
  className?: string
}

export function TableCell(props: TableCellProps) {
  return (
    <td
      className={clsx(
        'px-6 py-4 whitespace-nowrap text-left text-sm text-dark-brown',
        props.className
      )}
      colSpan={props.colSpan}
    >
      {props.children}
    </td>
  )
}
