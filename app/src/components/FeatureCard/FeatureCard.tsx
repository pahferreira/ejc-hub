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
    <section className="w-full bg-tertiary px-6 py-4 rounded border border-tertiary shadow-warm shadow-md">
      <div className="flex items-start justify-between">
        <figure aria-hidden>{icon}</figure>
        {props.number !== undefined && (
          <span className="text-5xl font-bold text-secondary leading-none">{props.number}</span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="m-0 font-bold text-black">{props.title}</h3>
        <p className="mt-2 mb-0 text-sm text-gray-600 leading-relaxed">{props.description}</p>
      </div>
    </section>
  )
}
