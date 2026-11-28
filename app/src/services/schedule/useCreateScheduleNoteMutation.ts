import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from './schedule.api'
import { scheduleQueryKeys } from './schedule.types'

/** Leaves an Observação on an activity, then refetches the schedule so it shows. */
export function useCreateScheduleNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: scheduleApi.createNote,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all })
    },
  })
}
