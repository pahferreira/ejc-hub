import { useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from './attendance.api'
import { attendanceQueryKeys } from './attendance.types'

/** Edits a meeting, then refetches the Reuniões read model like a register does. */
export function useUpdateMeetingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: attendanceApi.updateMeeting,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all })
    },
  })
}
