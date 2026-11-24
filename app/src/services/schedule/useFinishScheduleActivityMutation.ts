import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from './schedule.api'
import { scheduleMutationKeys, scheduleQueryKeys } from './schedule.types'

/**
 * Finishes an activity, then refetches the schedule. A refusal refetches too: a 409
 * (another admin acted first) or a stale 400/404 means the screen is behind.
 * The mutation stays pending until the refetch lands, so the buttons don't
 * come back on the old state.
 */
export function useFinishScheduleActivityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: scheduleMutationKeys.control,
    mutationFn: scheduleApi.finishActivity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all }),
    onError: () => queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all }),
  })
}
