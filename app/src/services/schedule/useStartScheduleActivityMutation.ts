import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from './schedule.api'
import { scheduleQueryKeys } from './schedule.types'

/**
 * Starts an activity, then refetches the schedule. A refusal refetches too: a 409
 * (another admin acted first) or a stale 400/404 means the screen is behind.
 * The mutation stays pending until the refetch lands, so the buttons don't
 * come back on the old state.
 */
export function useStartScheduleActivityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: scheduleApi.startActivity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all }),
    onError: () => queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all }),
  })
}
