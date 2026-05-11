import type { ReactNode } from 'react'

export type PillProps = {
  children: ReactNode
}

export function Pill(props: PillProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
      {props.children}
    </span>
  )
}
