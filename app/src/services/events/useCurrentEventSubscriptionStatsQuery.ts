import { useQuery } from '@tanstack/react-query'
import { eventsApi } from './events.api'
import { subscriptionsQueryKeys } from './events.types'

export function useCurrentEventSubscriptionStatsQuery() {
  const query = useQuery({
    queryKey: subscriptionsQueryKeys.currentEventStats,
    queryFn: eventsApi.getCurrentEventSubscriptionStats,
  })

  return query
}
