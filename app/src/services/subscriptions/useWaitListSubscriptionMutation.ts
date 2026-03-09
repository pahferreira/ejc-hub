import { useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi } from './subscriptions.api'
import { subscriptionsQueryKeys } from '../events/events.types'

export function useWaitListSubscriptionMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: subscriptionsApi.waitListSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsQueryKeys.currentEvent })
    },
  })

  return mutation
}
