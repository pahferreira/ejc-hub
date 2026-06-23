import type { ReactNode } from 'react'
import { FiUsers, FiClock, FiCheck, FiInbox } from 'react-icons/fi'
import { LuHourglass } from 'react-icons/lu'
import { Card } from '../Card/Card'

type SummaryBoxProps = {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  variant?: 'total' | 'completed' | 'pending' | 'waitlist' | 'received'
  active?: boolean
  onClick?: () => void
}

const variantStyles = {
  total: {
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    defaultIcon: <FiUsers size="20px" />,
  },
  completed: {
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
    defaultIcon: <LuHourglass size="20px" />,
  },
  received: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    defaultIcon: <FiInbox size="20px" />,
  },
}

export function SubscriptionSummaryBox(props: SummaryBoxProps) {
  const variant = props.variant || 'total'
  const variantConfig = variantStyles[variant]

  const content = (
    <>
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
    </>
  )

  if (props.onClick) {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className="max-w-xs w-full text-left rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
      >
        <Card focused={props.active} className="max-w-xl">
          {content}
        </Card>
      </button>
    )
  }

  return <Card className="max-w-xl">{content}</Card>
}
