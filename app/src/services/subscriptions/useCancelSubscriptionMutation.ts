import { useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi } from './subscriptions.api'
import { subscriptionsQueryKeys } from '../events/events.types'
import { teamBuildingQueryKeys } from '../team-building/team-building.types'

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: subscriptionsApi.cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsQueryKeys.currentEvent })
      // Cancelling deletes the person's team memberships, so a stale board would
      // still show them in a team column with a stale count.
      queryClient.invalidateQueries({ queryKey: teamBuildingQueryKeys.board })
    },
  })

  return mutation
}
