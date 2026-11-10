import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from './schedule.api'
import { scheduleQueryKeys, type UpdateScheduleDayBody } from './schedule.types'

/** Moves a day to another date, then refetches the schedule so its tab moves. */
export function useUpdateScheduleDayMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ dayId, body }: { dayId: string; body: UpdateScheduleDayBody }) =>
      scheduleApi.updateDay(dayId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all })
    },
  })
}
