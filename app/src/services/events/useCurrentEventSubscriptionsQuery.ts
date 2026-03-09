import { useQuery } from '@tanstack/react-query'
import { eventsApi } from './events.api'
import { subscriptionsQueryKeys } from './events.types'

export function useCurrentEventSubscriptionsQuery() {
  const query = useQuery({
    queryKey: subscriptionsQueryKeys.currentEvent,
    queryFn: eventsApi.getCurrentEventSubscriptionsList,
  })

  return query
}
