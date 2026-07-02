import { useQuery } from '@tanstack/react-query'
import { teamBuildingApi } from './team-building.api'
import { teamBuildingQueryKeys } from './team-building.types'

export function useAssignCoordinatorCandidatesQuery(teamInstanceId: string | null) {
  const query = useQuery({
    queryKey: teamBuildingQueryKeys.candidates(teamInstanceId ?? ''),
    queryFn: () => teamBuildingApi.getCandidates(teamInstanceId!),
    enabled: Boolean(teamInstanceId),
  })

  return query
}
