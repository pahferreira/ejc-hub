import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from './schedule.api'
import { scheduleQueryKeys } from './schedule.types'

/** Deletes a day and its activities, then refetches the schedule. */
export function useDeleteScheduleDayMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: scheduleApi.deleteDay,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all })
    },
  })
}
