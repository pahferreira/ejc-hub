import type { ReactNode } from 'react'

type TableBodyProps = {
  children: ReactNode
}

export function TableBody(props: TableBodyProps) {
  return <tbody className="bg-white divide-y divide-gray-200">{props.children}</tbody>
}
