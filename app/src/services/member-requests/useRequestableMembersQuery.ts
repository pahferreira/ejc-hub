import { useQuery } from '@tanstack/react-query'
import { memberRequestsApi } from './member-requests.api'
import {
  memberRequestQueryKeys,
  type RequestableCandidateFilters,
  type RequestPagination,
} from './member-requests.types'

export type UseRequestableMembersQueryOptions = {
  /**
   * Gates the fetch on the caller already being confirmed a coordinator.
   *
   * The route 403s for anyone who is not — self-derived from the caller's own
   * membership, same as endpoint #1. Firing it unconditionally would race a
   * permission boundary into the page's generic "could not load" branch
   * instead of its friendlier "not a coordinator" one. Defaults to `true`.
   */
  enabled?: boolean
}

export function useRequestableMembersQuery(
  filters: RequestableCandidateFilters = {},
  pagination: RequestPagination = {},
  options: UseRequestableMembersQueryOptions = {}
) {
  const query = useQuery({
    queryKey: memberRequestQueryKeys.requestableMembersList(filters, pagination),
    queryFn: () => memberRequestsApi.getRequestableMembers(filters, pagination),
    // Keeps the previous page on screen while the next one loads, so paging
    // and filtering do not blank the table out between renders.
    placeholderData: (previous) => previous,
    enabled: options.enabled ?? true,
  })

  return query
}
