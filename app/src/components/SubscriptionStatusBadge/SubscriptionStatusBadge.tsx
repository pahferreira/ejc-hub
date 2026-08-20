import { Badge, type BadgeVariant } from '../Badge/Badge'
import { subscriptionStatusDisplay } from '../../services/events/subscriptionStatusDisplay'
import type { SubscriptionStatus } from '../../services/events/events.types'

const statusVariant: Record<SubscriptionStatus, BadgeVariant> = {
  pending: 'warning',
  received: 'info',
  completed: 'success',
  waiting_list: 'warning',
  cancelled: 'error',
}

export type SubscriptionStatusBadgeProps = {
  status: SubscriptionStatus
}

export function SubscriptionStatusBadge(props: SubscriptionStatusBadgeProps) {
  return (
    <Badge variant={statusVariant[props.status]}>
      {subscriptionStatusDisplay[props.status].label}
    </Badge>
  )
}
