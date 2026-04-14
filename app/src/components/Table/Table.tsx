import type { ReactNode } from 'react'

type TableProps = {
  children: ReactNode
}

export function Table(props: TableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-tertiary">
      <table className="min-w-full divide-y divide-secondary">{props.children}</table>
    </div>
  )
}
