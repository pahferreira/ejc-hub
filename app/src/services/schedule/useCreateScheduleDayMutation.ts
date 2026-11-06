import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from './schedule.api'
import { scheduleQueryKeys } from './schedule.types'

/** Adds a day, then refetches the schedule so its tab appears. */
export function useCreateScheduleDayMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: scheduleApi.createDay,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all })
    },
  })
}
