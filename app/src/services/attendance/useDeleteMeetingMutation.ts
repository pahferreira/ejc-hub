import { useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from './attendance.api'
import { attendanceQueryKeys } from './attendance.types'

/** Deletes a meeting, then refetches the read model: every rate drops it at once. */
export function useDeleteMeetingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: attendanceApi.deleteMeeting,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all })
    },
  })
}
