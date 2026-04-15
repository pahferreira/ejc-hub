import type { ReactNode } from 'react'
import { FiCheckCircle, FiAlertCircle, FiUsers, FiTrendingUp } from 'react-icons/fi'
import { Card } from '../Card/Card'

export type StatusCardProps = {
  title: string
  value: string | number
  variant: 'neutral' | 'success' | 'error' | 'info'
  description?: string
  icon?: ReactNode
}

const variantConfig = {
  neutral: {
    iconBg: 'bg-dark-brown',
    defaultIcon: <FiUsers size="24px" />,
  },
  success: {
    iconBg: 'bg-green',
    defaultIcon: <FiCheckCircle size="24px" />,
  },
  error: {
    iconBg: 'bg-red',
    defaultIcon: <FiAlertCircle size="24px" />,
  },
  info: {
    iconBg: 'bg-blue',
    defaultIcon: <FiTrendingUp size="24px" />,
  },
}

export function StatusCard(props: StatusCardProps) {
  const config = variantConfig[props.variant]

  return (
    <Card className="max-w-xs">
      <div className="flex items-center gap-4">
        <figure
          className={`flex items-center justify-center p-3 rounded-xl ${config.iconBg} shrink-0`}
        >
          <div className="text-white" aria-hidden>
            {props.icon || config.defaultIcon}
          </div>
        </figure>
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-gray-500">{props.title}</span>
          <span className="text-3xl font-bold text-gray-900">{props.value}</span>
          {props.description && (
            <span className="text-xs text-gray-500">{props.description}</span>
          )}
        </div>
      </div>
    </Card>
  )
}
