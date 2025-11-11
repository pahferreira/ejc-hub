import type { ReactNode } from 'react'
import { FiUsers, FiClock, FiCheck } from 'react-icons/fi'
import { Card } from '../Card/Card'

type SummaryBoxProps = {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  variant?: 'total' | 'approved' | 'pending'
}

const variantStyles = {
  total: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    defaultIcon: <FiUsers size="20px" />,
  },
  approved: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    defaultIcon: <FiCheck size="20px" />,
  },
  pending: {
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    defaultIcon: <FiClock size="20px" />,
  },
}

export function SubscriptionSummaryBox(props: SummaryBoxProps) {
  const variant = props.variant || 'total'
  const variantConfig = variantStyles[variant]

  return (
    <Card>
      <div className="flex items-center gap-4">
        <figure
          className={`flex items-center justify-center p-2 rounded-lg ${variantConfig.iconBg}`}
        >
          <div className={variantConfig.iconColor}>{props.icon || variantConfig.defaultIcon}</div>
        </figure>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">{props.title}</label>
          <span className="text-2xl font-bold text-gray-900">{props.value}</span>
        </div>
      </div>
    </Card>
  )
}
