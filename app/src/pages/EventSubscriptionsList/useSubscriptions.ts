import { useCurrentEventSubscriptionsQuery } from '../../services/events/useCurrentEventSubscriptionsQuery'
import { useCurrentEventSubscriptionStatsQuery } from '../../services/events/useCurrentEventSubscriptionStatsQuery'
import type {
  SubscriptionListFilters,
  SubscriptionStatsResponse,
} from '../../services/events/events.types'
import type { SubscriptionWithDetails } from '../../services/subscriptions/subscriptions.types'

type UseSubscriptionsArgs = {
  filters: SubscriptionListFilters
}

type UseSubscriptionsReturn = {
  subscriptions: SubscriptionWithDetails[]
  total: number
  totalCount: number
  stats: SubscriptionStatsResponse
  isLoading: boolean
  error: Error | null
  isStatsLoading: boolean
  statsError: Error | null
}

const defaultStats: SubscriptionStatsResponse = {
  pending: 0,
  received: 0,
  completed: 0,
  waiting_list: 0,
}

export function useSubscriptions(args: UseSubscriptionsArgs): UseSubscriptionsReturn {
  const listQuery = useCurrentEventSubscriptionsQuery(args.filters)
  const statsQuery = useCurrentEventSubscriptionStatsQuery()
  const stats = statsQuery.data ?? defaultStats

  return {
    subscriptions: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    totalCount: stats.pending + stats.received + stats.completed + stats.waiting_list,
    stats,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    isStatsLoading: statsQuery.isLoading,
    statsError: statsQuery.error,
  }
}
