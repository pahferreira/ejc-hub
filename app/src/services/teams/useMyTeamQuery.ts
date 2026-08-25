import { useQuery } from '@tanstack/react-query'
import { teamsApi } from './teams.api'
import { teamsOverviewQueryKeys } from './teams.types'

/**
 * The authenticated user's team for the current event. Resolves to `null` (not
 * an error) when the user has no membership yet, so callers can render an empty
 * state rather than an error.
 */
export function useMyTeamQuery() {
  const query = useQuery({
    queryKey: teamsOverviewQueryKeys.myTeam,
    queryFn: teamsApi.getMyCurrentEventTeam,
  })

  return query
}
