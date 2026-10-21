import { useQuery } from '@tanstack/react-query'
import { attendanceApi } from './attendance.api'
import { attendanceQueryKeys } from './attendance.types'

export type UseMyAttendanceQueryOptions = {
  /**
   * Gates the fetch on the caller already being confirmed on a team, for the
   * same reason as `useMyTeamAttendanceQuery`: the route 403s for anyone who is
   * not. Defaults to `true`.
   */
  enabled?: boolean
}

export function useMyAttendanceQuery(options: UseMyAttendanceQueryOptions = {}) {
  const query = useQuery({
    queryKey: attendanceQueryKeys.me,
    queryFn: attendanceApi.getMyAttendance,
    enabled: options.enabled ?? true,
  })

  return query
}
