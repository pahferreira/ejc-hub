import { useQuery } from '@tanstack/react-query'
import { attendanceApi } from './attendance.api'
import { attendanceQueryKeys } from './attendance.types'

export type UseTeamAttendanceQueryOptions = {
  /**
   * Gates the fetch on the flag and on `attendance:read`. The route 403s
   * without the permission, so firing anyway would only surface an error on
   * Team Detail. Defaults to `true`.
   */
  enabled?: boolean
}

export function useTeamAttendanceQuery(
  teamInstanceId: string | undefined,
  options: UseTeamAttendanceQueryOptions = {}
) {
  const query = useQuery({
    queryKey: attendanceQueryKeys.team(teamInstanceId ?? ''),
    queryFn: () => attendanceApi.getTeamAttendance(teamInstanceId ?? ''),
    enabled: Boolean(teamInstanceId) && (options.enabled ?? true),
  })

  return query
}
