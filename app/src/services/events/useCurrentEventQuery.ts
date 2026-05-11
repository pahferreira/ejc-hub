import { useQuery } from '@tanstack/react-query'
import { eventsApi } from './events.api'
import { eventsQueryKeys } from './events.types'

export function useCurrentEventQuery() {
  const query = useQuery({
    queryKey: eventsQueryKeys.currentEvent,
    queryFn: eventsApi.getCurrentEvent,
  })

  return query
}
