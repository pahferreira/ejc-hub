import { useQuery } from '@tanstack/react-query'
import { memberRequestsApi } from './member-requests.api'
import { memberRequestQueryKeys, type MyTeamRequestFilters } from './member-requests.types'

export type UseMyTeamRequestsQueryOptions = {
  /**
   * Gates the fetch on the caller already being confirmed a coordinator.
   *
   * The route 403s for anyone who is not — self-derived from the caller's own
   * membership, same as `useRequestableMembersQuery`. Firing it unconditionally
   * would race that 403 into the page's generic "could not load" branch
   * instead of its friendlier "not a coordinator" one. Defaults to `true`.
   */
  enabled?: boolean
}

export function useMyTeamRequestsQuery(
  filters: MyTeamRequestFilters = {},
  options: UseMyTeamRequestsQueryOptions = {}
) {
  const query = useQuery({
    queryKey: memberRequestQueryKeys.myTeamList(filters),
    queryFn: () => memberRequestsApi.getMyTeamRequests(filters),
    enabled: options.enabled ?? true,
  })

  return query
}
