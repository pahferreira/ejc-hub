import { useMutation, useQueryClient } from '@tanstack/react-query'
import { teamBuildingApi } from './team-building.api'
import { teamBuildingQueryKeys } from './team-building.types'
import { teamsOverviewQueryKeys } from '../teams/teams.types'

type AddMembersVars = {
  teamInstanceId: string
  userIds: string[]
}

export function useAddMembersMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (vars: AddMembersVars) =>
      teamBuildingApi.addMembers(vars.teamInstanceId, vars.userIds),
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
