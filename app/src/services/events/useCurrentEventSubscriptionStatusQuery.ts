import { useQuery } from '@tanstack/react-query'
import { eventsApi } from './events.api'
import { subscriptionsQueryKeys } from './events.types'

export function useCurrentEventSubscriptionStatusQuery() {
  const query = useQuery({
    queryKey: subscriptionsQueryKeys.currentEventForMe,
    queryFn: eventsApi.getCurrentEventSubscriptionStatus,
  })

  return query
}
