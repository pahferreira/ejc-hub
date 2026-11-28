import { useQuery } from '@tanstack/react-query'
import { scheduleApi } from './schedule.api'
import { scheduleQueryKeys } from './schedule.types'

/** Polls a minute apart while visible, and refetches whenever the tab comes back. */
const LIVE_REFETCH_INTERVAL_MS = 60_000

export type UseScheduleQueryOptions = {
  /** The Running Schedule keeps the page in sync without a reload. */
  live?: boolean
}

export function useScheduleQuery(options: UseScheduleQueryOptions = {}) {
  const query = useQuery({
    queryKey: scheduleQueryKeys.all,
    queryFn: scheduleApi.getSchedule,
    refetchInterval: options.live ? LIVE_REFETCH_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    // React Query refetches on `visibilitychange`, so reopening the app counts.
    refetchOnWindowFocus: options.live ? 'always' : true,
  })

  return query
}
