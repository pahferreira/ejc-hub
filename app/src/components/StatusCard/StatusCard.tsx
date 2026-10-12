import type { ReactNode } from 'react'
import { FiCheckCircle, FiAlertCircle, FiUsers, FiTrendingUp, FiClock } from 'react-icons/fi'
import { Card } from '../Card/Card'

export type StatusCardProps = {
  title?: string
  value: string | number
  variant: 'neutral' | 'success' | 'error' | 'info' | 'pending'
  description?: string
  icon?: ReactNode
  /** Makes the card a toggle filter, matching `SubscriptionSummaryBox`'s recipe. */
  onClick?: () => void
  /** Whether this card is the active filter. Ignored when `onClick` is unset. */
  active?: boolean
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
  pending: {
    iconBg: 'bg-dark-brown',
    defaultIcon: <FiClock size="24px" />,
  },
}

export function StatusCard(props: StatusCardProps) {
  const config = variantConfig[props.variant]

  const content = (
    <div className="flex items-center gap-4">
      <figure
        className={`flex items-center justify-center p-3 rounded-xl ${config.iconBg} shrink-0`}
      >
        <div className="text-white" aria-hidden>
          {props.icon || config.defaultIcon}
        </div>
      </figure>
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-black">{props.title}</span>
        <span className="text-3xl font-bold text-dark-brown">{props.value}</span>
        {props.description && (
          <span className="text-xs text-black font-light">{props.description}</span>
        )}
      </div>
    </div>
  )

  // Toggle-filter recipe, matching `SubscriptionSummaryBox`: a card with
  // `onClick` renders as a button so `active` can ring it; one without stays a
  // plain, unclickable `Card` — every existing call site.
  if (props.onClick) {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className="w-full max-w-md text-left rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
      >
        <Card className="max-w-md" focused={props.active}>
          {content}
        </Card>
      </button>
    )
  }

  return <Card className="max-w-md">{content}</Card>
}
