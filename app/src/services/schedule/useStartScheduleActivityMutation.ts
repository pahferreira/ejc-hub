import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isScheduleChangedError, scheduleApi } from './schedule.api'
import { scheduleQueryKeys } from './schedule.types'

/**
 * Starts an activity, then refetches the schedule. A 409 (another admin acted first)
 * refetches too, so the screen catches up with what really happened.
 */
export function useStartScheduleActivityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: scheduleApi.startActivity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all })
    },
    onError: (error) => {
      if (isScheduleChangedError(error)) {
        void queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all })
      }
    },
  })
}
