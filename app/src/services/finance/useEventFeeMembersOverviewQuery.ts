import { useQuery } from '@tanstack/react-query'
import { financeApi } from './finance.api'
import { financeQueryKeys } from './finance.types'

/** Event-wide fee counts for the "Taxa por Membro" cards. */
export function useEventFeeMembersOverviewQuery() {
  const query = useQuery({
    queryKey: financeQueryKeys.eventFeeMembersOverview,
    queryFn: financeApi.getEventFeeMembersOverview,
  })

  return query
}
