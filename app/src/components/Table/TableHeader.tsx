import type { ReactNode } from 'react'

type TableHeaderProps = {
  children: ReactNode
}

export function TableHeader(props: TableHeaderProps) {
  return <thead className="bg-gray-200">{props.children}</thead>
}
