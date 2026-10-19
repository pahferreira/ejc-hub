import { useQuery } from '@tanstack/react-query'
import { attendanceApi } from './attendance.api'
import { attendanceQueryKeys } from './attendance.types'

export type UseMyTeamAttendanceQueryOptions = {
  /**
   * Gates the fetch on the caller already being confirmed a coordinator.
   *
   * The route 403s for anyone who is not — self-derived from the caller's own
   * membership. Firing it unconditionally would race that 403 into the page's
   * generic "could not load" branch instead of its friendlier "not a
   * coordinator" one. Defaults to `true`.
   */
  enabled?: boolean
}

export function useMyTeamAttendanceQuery(options: UseMyTeamAttendanceQueryOptions = {}) {
  const query = useQuery({
    queryKey: attendanceQueryKeys.myTeam,
    queryFn: attendanceApi.getMyTeamAttendance,
    enabled: options.enabled ?? true,
  })

  return query
}
