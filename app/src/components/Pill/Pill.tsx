import clsx from 'clsx'
import type { ReactNode } from 'react'

export type PillProps = {
  children: ReactNode
  variant?: 'primary' | 'secondary'
}

export function Pill(props: PillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-secondary-foreground',
        props.variant === 'primary' ? 'bg-primary text-white' : 'bg-secondary'
      )}
    >
      {props.children}
    </span>
  )
}
