import type { ReactNode } from 'react'

type TableBodyProps = {
  children: ReactNode
}

export function TableBody(props: TableBodyProps) {
  return <tbody className="divide-y divide-gray-200 bg-white">{props.children}</tbody>
}
