import type { ReactNode } from 'react'

type TableProps = {
  children: ReactNode
}

export function Table(props: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">{props.children}</table>
    </div>
  )
}
