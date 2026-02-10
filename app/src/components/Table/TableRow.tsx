import type { ReactNode } from 'react'

type TableRowProps = {
  children: ReactNode
}

export function TableRow(props: TableRowProps) {
  return <tr className="hover:bg-gray-50">{props.children}</tr>
}
