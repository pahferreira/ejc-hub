import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from './schedule.api'
import { scheduleQueryKeys } from './schedule.types'

/** Adds an activity, then refetches the schedule so its card appears in order. */
export function useCreateScheduleActivityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: scheduleApi.createActivity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all })
    },
  })
}
