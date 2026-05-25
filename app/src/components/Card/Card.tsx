import clsx from 'clsx'
import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
  focused?: boolean
}

export function Card(props: CardProps) {
  return (
    <section
      className={clsx(
        'w-full bg-white px-6 py-4 rounded-xl shadow-md border transition-colors',
        props.className,
        props.focused ? 'border-dark-brown' : 'border-tertiary'
      )}
    >
      {props.children}
    </section>
  )
}
