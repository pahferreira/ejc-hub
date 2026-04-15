import type { ReactNode } from 'react'
import { FiUsers, FiClock, FiCheck } from 'react-icons/fi'
import { Card } from '../Card/Card'

type SummaryBoxProps = {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  variant?: 'total' | 'approved' | 'pending' | 'waitlist'
}

const variantStyles = {
  total: {
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    defaultIcon: <FiUsers size="20px" />,
  },
  approved: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    defaultIcon: <FiCheck size="20px" />,
  },
  pending: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    defaultIcon: <FiClock size="20px" />,
  },
  waitlist: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    defaultIcon: <FiClock size="20px" />,
  },
}

export function SubscriptionSummaryBox(props: SummaryBoxProps) {
  const variant = props.variant || 'total'
  const variantConfig = variantStyles[variant]

  return (
    <Card className="max-w-xs">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-gray-700">{props.title}</span>
        <figure
          className={`flex items-center justify-center p-2 rounded-lg ${variantConfig.iconBg}`}
        >
          <div className={variantConfig.iconColor}>{props.icon || variantConfig.defaultIcon}</div>
        </figure>
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-900">{props.value}</span>
      </div>
      {props.description && <p className="mt-1 text-xs text-gray-500">{props.description}</p>}
    </Card>
  )
}
