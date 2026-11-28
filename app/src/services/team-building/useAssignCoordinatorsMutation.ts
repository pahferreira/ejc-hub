import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { teamBuildingApi } from './team-building.api'
import { teamBuildingQueryKeys } from './team-building.types'
import { teamsOverviewQueryKeys } from '../teams/teams.types'
import { attendanceQueryKeys } from '../attendance/attendance.types'

type AssignCoordinatorsVars = {
  teamInstanceId: string
  coordinatorIds: string[]
}

/** The queries a change to a team's coordinators leaves stale. */
export function assignCoordinatorsStaleKeys(teamInstanceId: string): QueryKey[] {
  return [
    teamsOverviewQueryKeys.stats,
    teamsOverviewQueryKeys.lists,
    teamsOverviewQueryKeys.details,
    teamBuildingQueryKeys.teamCandidates(teamInstanceId),
    attendanceQueryKeys.team(teamInstanceId),
  ]
}

export function useAssignCoordinatorsMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (vars: AssignCoordinatorsVars) =>
      teamBuildingApi.assignCoordinators(vars.teamInstanceId, vars.coordinatorIds),
    onSuccess: (_, vars) => {
      for (const queryKey of assignCoordinatorsStaleKeys(vars.teamInstanceId)) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  return mutation
}
