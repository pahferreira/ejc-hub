import type { ReactNode } from 'react'

type TableBodyProps = {
  children: ReactNode
}

export function TableBody(props: TableBodyProps) {
  return (
    <tbody className="divide-y divide-gray-200 bg-white [&>tr]:hover:bg-table-highlight">
      {props.children}
    </tbody>
  )
}
