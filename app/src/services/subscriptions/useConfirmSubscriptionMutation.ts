import { useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi } from './subscriptions.api'
import { subscriptionsQueryKeys } from '../events/events.types'

export function useConfirmSubscriptionMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: subscriptionsApi.confirmSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsQueryKeys.currentEvent })
    },
  })

  return mutation
}
