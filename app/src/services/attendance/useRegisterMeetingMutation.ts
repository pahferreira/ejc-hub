import { useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from './attendance.api'
import { attendanceQueryKeys } from './attendance.types'

/**
 * Registers a meeting, then refetches the Reuniões read model so the meeting
 * list, the stat pills and every rate in the Membros table update together.
 */
export function useRegisterMeetingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: attendanceApi.registerMeeting,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all })
    },
  })
}
