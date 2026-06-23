import { useQuery } from '@tanstack/react-query'
import { teamsApi } from './teams.api'
import { teamsOverviewQueryKeys } from './teams.types'

export function useTeamsOverviewQuery() {
  const query = useQuery({
    queryKey: teamsOverviewQueryKeys.stats,
    queryFn: teamsApi.getCurrentEventTeamsOverview,
  })

  return query
}
