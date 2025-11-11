import type { ReactNode } from 'react'
import { FiZap } from 'react-icons/fi'
import { Card } from '../Card/Card'

export type FeatureCardProps = {
  title: string
  description: string
  /** Optional icon (defaults to a lightning bolt) */
  icon?: ReactNode
}

export function FeatureCard(props: FeatureCardProps) {
  const { icon = <FiZap size="20px" /> } = props

  return (
    <Card>
      <div className="flex flex-col items-center gap-2">
        <figure className="p-3 rounded-lg bg-blue-100 w-fit" aria-hidden>
          <div className="text-blue-600">{icon}</div>
        </figure>
        <div className="flex flex-col">
          <h3 className="m-0 text-lg font-semibold text-gray-900">{props.title}</h3>
          <p className="mt-2 mb-0 text-base font-normal text-gray-600 leading-relaxed">
            {props.description}
          </p>
        </div>
      </div>
    </Card>
  )
}
