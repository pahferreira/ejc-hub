import { useQuery } from '@tanstack/react-query'
import { generalApi } from './general.api'

export function useHealthCheckQuery() {
  const queryResponse = useQuery({
    queryKey: ['healthCheck'],
    queryFn: generalApi.getHealthCheck,
  })

  return queryResponse
}
