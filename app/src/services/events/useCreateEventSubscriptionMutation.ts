import { useMutation } from '@tanstack/react-query'
import { eventsApi } from './events.api'

export function useCreateEventSubscriptionMutation() {
  const mutation = useMutation({
    mutationFn: eventsApi.createEventSubscription,
  })

  return mutation
}
