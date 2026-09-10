import clsx from 'clsx'
import type { ReactNode } from 'react'

type TableRowProps = {
  children: ReactNode
  /** Extra classes on the row, e.g. a selected-state background. */
  className?: string
}

export function TableRow(props: TableRowProps) {
  return <tr className={clsx(props.className)}>{props.children}</tr>
}
