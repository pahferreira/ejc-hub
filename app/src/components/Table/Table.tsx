import clsx from 'clsx'
import type { ReactNode } from 'react'

type TableProps = {
  children: ReactNode
  /**
   * Frames the table in a rounded border. Defaults to `true`. Pass `false` when
   * the table sits inside a card that already provides the frame, so the header
   * strip can run edge to edge.
   */
  bordered?: boolean
}

export function Table(props: TableProps) {
  const bordered = props.bordered ?? true

  return (
    <div className={clsx('overflow-x-auto', bordered && 'rounded-lg border border-tertiary')}>
      <table className="min-w-full divide-y divide-secondary">{props.children}</table>
    </div>
  )
}
