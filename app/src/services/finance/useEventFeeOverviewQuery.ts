import { useQuery } from '@tanstack/react-query'
import { financeApi } from './finance.api'
import { financeQueryKeys } from './finance.types'

export function useEventFeeOverviewQuery() {
  const query = useQuery({
    queryKey: financeQueryKeys.eventFeeOverview,
    queryFn: financeApi.getEventFeeOverview,
  })

  return query
}
