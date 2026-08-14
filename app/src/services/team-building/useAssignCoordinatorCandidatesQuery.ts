import { useQuery } from '@tanstack/react-query'
import { teamBuildingApi } from './team-building.api'
import { teamBuildingQueryKeys, type CandidateRole } from './team-building.types'

export function useAssignCoordinatorCandidatesQuery(
  teamInstanceId: string | null,
  role: CandidateRole = 'coordinator'
) {
  const query = useQuery({
    // Role is appended after the teamCandidates prefix so per-team invalidation
    // (which keys off that prefix) still clears both role variants.
    queryKey: [...teamBuildingQueryKeys.teamCandidates(teamInstanceId ?? ''), role],
    queryFn: () => teamBuildingApi.getCandidates(teamInstanceId!, role),
    enabled: Boolean(teamInstanceId),
  })

  return query
}
