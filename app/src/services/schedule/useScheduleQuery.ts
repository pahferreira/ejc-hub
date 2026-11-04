import { useQuery } from '@tanstack/react-query'
import { scheduleApi } from './schedule.api'
import { scheduleQueryKeys } from './schedule.types'

export function useScheduleQuery() {
  const query = useQuery({
    queryKey: scheduleQueryKeys.all,
    queryFn: scheduleApi.getSchedule,
  })

  return query
}
