import { useQuery } from '@tanstack/react-query'
import { financeApi } from './finance.api'
import { financeQueryKeys } from './finance.types'

/** Counts, the per-team breakdown and the money for "Taxa de Inscrição". */
export function useEventFeeTeamsOverviewQuery() {
  const query = useQuery({
    queryKey: financeQueryKeys.eventFeeTeamsOverview,
    queryFn: financeApi.getEventFeeTeamsOverview,
  })

  return query
}
