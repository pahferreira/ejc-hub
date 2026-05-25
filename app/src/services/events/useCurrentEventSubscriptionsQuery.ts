import { useQuery } from '@tanstack/react-query'
import { eventsApi } from './events.api'
import {
  subscriptionsQueryKeys,
  type SubscriptionListFilters,
  type SubscriptionListPagination,
} from './events.types'

export function useCurrentEventSubscriptionsQuery(
  filters: SubscriptionListFilters = {},
  pagination: SubscriptionListPagination = {}
) {
  const query = useQuery({
    queryKey: subscriptionsQueryKeys.currentEventListSubscriptions(filters, pagination),
    queryFn: () => eventsApi.getCurrentEventSubscriptionsList(filters, pagination),
    placeholderData: (prev) => prev,
  })

  return query
}
