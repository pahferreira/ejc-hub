import { useMutation, useQueryClient } from '@tanstack/react-query'
import { teamBuildingApi } from './team-building.api'
import { teamBuildingQueryKeys } from './team-building.types'
import { teamsOverviewQueryKeys } from '../teams/teams.types'

type AssignCoordinatorsVars = {
  teamInstanceId: string
  coordinatorIds: string[]
}

export function useAssignCoordinatorsMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (vars: AssignCoordinatorsVars) =>
      teamBuildingApi.assignCoordinators(vars.teamInstanceId, vars.coordinatorIds),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: teamsOverviewQueryKeys.stats })
      queryClient.invalidateQueries({ queryKey: teamsOverviewQueryKeys.lists })
      queryClient.invalidateQueries({
        queryKey: teamBuildingQueryKeys.teamCandidates(vars.teamInstanceId),
      })
    },
  })

  return mutation
}
