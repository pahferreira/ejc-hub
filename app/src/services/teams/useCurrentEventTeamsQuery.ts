import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { teamsApi } from './teams.api'
import { teamsOverviewQueryKeys, type TeamsListFilters } from './teams.types'

export function useCurrentEventTeamsQuery(filters: TeamsListFilters = {}) {
  const query = useQuery({
    queryKey: teamsOverviewQueryKeys.list(filters),
    queryFn: () => teamsApi.getCurrentEventTeams(filters),
    placeholderData: keepPreviousData,
  })

  return query
}
