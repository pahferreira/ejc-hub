import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from './events.api'
import { eventsQueryKeys } from './events.types'

type HandleEventSubscriptionsInput = {
  eventId: string
  open: boolean
}

export function useHandleEventSubscriptionsMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: HandleEventSubscriptionsInput) =>
      eventsApi.handleEventSubscriptions(input.eventId, input.open),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.currentEvent })
    },
  })

  return mutation
}
