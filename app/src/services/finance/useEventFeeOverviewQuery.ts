import { useQuery } from '@tanstack/react-query'
import { eventFeeOverviewMock } from './finance.mocks'
import { financeQueryKeys } from './finance.types'

/**
 * Mocked until `GET /events/current/event-fee-overview` lands. Swapping in the
 * real API is a one-line change to `queryFn`; callers already consume the
 * react-query result shape.
 */
export function useEventFeeOverviewQuery() {
  const query = useQuery({
    queryKey: financeQueryKeys.eventFeeOverview,
    queryFn: async () => eventFeeOverviewMock,
  })

  return query
}
