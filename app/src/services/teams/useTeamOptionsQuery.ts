import { useQuery } from '@tanstack/react-query'
import { teamsApi } from './teams.api'
import { teamOptionsQueryKeys } from './teams.types'

export function useTeamOptionsQuery() {
  const query = useQuery({
    queryKey: teamOptionsQueryKeys.all,
    queryFn: teamsApi.getTeamOptions,
  })

  return query
}
