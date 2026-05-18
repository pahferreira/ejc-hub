import type { ReactNode } from 'react'

type TableRowProps = {
  children: ReactNode
}

export function TableRow(props: TableRowProps) {
  return <tr>{props.children}</tr>
}
