import type { ReactNode } from 'react'

type TableRowProps = {
  children: ReactNode
}

export function TableRow(props: TableRowProps) {
  return <tr className="hover:bg-tertiary-foreground">{props.children}</tr>
}
