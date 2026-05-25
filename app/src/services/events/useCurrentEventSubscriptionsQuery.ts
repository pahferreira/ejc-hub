import { useQuery } from '@tanstack/react-query'
import { eventsApi } from './events.api'
import { subscriptionsQueryKeys, type SubscriptionListFilters } from './events.types'

export function useCurrentEventSubscriptionsQuery(filters: SubscriptionListFilters = {}) {
  const query = useQuery({
    queryKey: subscriptionsQueryKeys.currentEventListSubscriptions(filters),
    queryFn: () => eventsApi.getCurrentEventSubscriptionsList(filters),
    placeholderData: (prev) => prev,
  })

  return query
}
