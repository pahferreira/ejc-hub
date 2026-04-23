import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card(props: CardProps) {
  return (
    <section
      className={`w-full bg-white px-6 py-4 rounded border border-tertiary shadow-md ${props.className ?? ''}`}
    >
      {props.children}
    </section>
  )
}
