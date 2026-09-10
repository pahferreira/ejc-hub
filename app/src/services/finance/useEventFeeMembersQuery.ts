import { useQuery } from '@tanstack/react-query'
import { financeApi } from './finance.api'
import {
  financeQueryKeys,
  type EventFeeMemberFilters,
  type EventFeeMemberPagination,
} from './finance.types'

export function useEventFeeMembersQuery(
  filters: EventFeeMemberFilters = {},
  pagination: EventFeeMemberPagination = {}
) {
  const query = useQuery({
    queryKey: financeQueryKeys.eventFeeMembersList(filters, pagination),
    queryFn: () => financeApi.getEventFeeMembers(filters, pagination),
    // Keeps the previous page on screen while the next one loads, so paging and
    // filtering do not blank the table out between renders.
    placeholderData: (previous) => previous,
  })

  return query
}
