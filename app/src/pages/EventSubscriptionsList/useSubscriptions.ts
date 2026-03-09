import { useCurrentEventSubscriptionsQuery } from '../../services/events/useCurrentEventSubscriptionsQuery'
import type { SubscriptionStats, SubscriptionWithDetails } from './subscription.types'

type UseSubscriptionsReturn = {
  subscriptions: SubscriptionWithDetails[]
  stats: SubscriptionStats
  isLoading: boolean
  error: Error | null
}

function calculateStats(subscriptions: SubscriptionWithDetails[]): SubscriptionStats {
  return {
    total: subscriptions.length,
    pending: subscriptions.filter((s) => s.status === 'pending').length,
    approved: subscriptions.filter((s) => s.status === 'received').length,
    completed: subscriptions.filter((s) => s.status === 'completed').length,
    waitingList: subscriptions.filter((s) => s.status === 'waiting_list').length,
  }
}

export function useSubscriptions(): UseSubscriptionsReturn {
  const query = useCurrentEventSubscriptionsQuery()
  const subscriptions = query.data ?? []
  const stats = calculateStats(subscriptions)

  return {
    subscriptions,
    stats,
    isLoading: query.isLoading,
    error: query.error,
  }
}
