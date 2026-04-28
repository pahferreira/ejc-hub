import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from './events.api'
import { subscriptionsQueryKeys } from './events.types'

export function useCreateEventSubscriptionMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: eventsApi.createEventSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsQueryKeys.currentEventForMe })
      queryClient.invalidateQueries({ queryKey: subscriptionsQueryKeys.currentEvent })
    },
  })

  return mutation
}
