import { useQuery } from '@tanstack/react-query'
import { memberRequestsApi } from './member-requests.api'
import {
  memberRequestQueryKeys,
  type MemberRequestQueueFilters,
  type RequestPagination,
} from './member-requests.types'

export function useMemberRequestQueueQuery(
  filters: MemberRequestQueueFilters = {},
  pagination: RequestPagination = {}
) {
  const query = useQuery({
    queryKey: memberRequestQueryKeys.queueList(filters, pagination),
    queryFn: () => memberRequestsApi.getMemberRequestQueue(filters, pagination),
    // Keeps the current page on screen while the next one loads. This matters
    // more here than on the coordinator page: every approval invalidates the
    // whole queue (plan H.8), so without it the table would blank on each
    // decision — which is the part that actually felt bad.
    placeholderData: (previous) => previous,
  })

  return query
}
