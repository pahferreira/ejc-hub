import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
}

export function Card(props: CardProps) {
  return <section className="w-full bg-white px-6 py-4 shadow">{props.children}</section>
}
