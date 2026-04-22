import type { ReactNode } from 'react'
import { FiZap } from 'react-icons/fi'

export type FeatureCardProps = {
  title: string
  description: string
  /** Optional icon (defaults to a lightning bolt) */
  icon?: ReactNode
  /** Optional step number displayed in the top-right corner */
  number?: number
}

export function FeatureCard(props: FeatureCardProps) {
  const { icon = <FiZap size="20px" /> } = props

  return (
    <section className="grid gap-2 w-full bg-tertiary/10 px-6 py-4 rounded-md border border-secondary shadow-md text-left">
      <div className="flex items-center justify-between">
        <figure aria-hidden>{icon}</figure>
        {props.number !== undefined && (
          <span className="text-5xl font-bold text-secondary leading-none">{props.number}</span>
        )}
      </div>
      <h3 className="font-bold text-black">{props.title}</h3>
      <p className="text-sm text-black leading-relaxed">{props.description}</p>
    </section>
  )
}
