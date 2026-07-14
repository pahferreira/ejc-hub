import { useQuery } from '@tanstack/react-query'
import { circlesApi } from './circles.api'
import { circlesQueryKeys } from './circles.types'

export function useCirclesQuery() {
  const query = useQuery({
    queryKey: circlesQueryKeys.list,
    queryFn: circlesApi.getCircles,
  })

  return query
}
