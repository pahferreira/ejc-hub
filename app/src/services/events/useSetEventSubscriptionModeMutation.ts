import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from './events.api'
import { eventsQueryKeys, type EventSubscriptionMode } from './events.types'

type SetEventSubscriptionModeInput = {
  eventId: string
  mode: EventSubscriptionMode
}

export function useSetEventSubscriptionModeMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: SetEventSubscriptionModeInput) =>
      eventsApi.setEventSubscriptionMode(input.eventId, input.mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.currentEvent })
    },
  })

  return mutation
}
