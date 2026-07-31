import { useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsApi } from './teams.api'
import { teamsOverviewQueryKeys } from './teams.types'

type RemoveTeamMemberVars = {
  teamId: string
  memberId: string
  /** The team's route key, used to invalidate its detail query after removal. */
  teamKey: string
}

export function useRemoveTeamMemberMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (vars: RemoveTeamMemberVars) =>
      teamsApi.removeTeamMember(vars.teamId, vars.memberId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: teamsOverviewQueryKeys.stats })
      queryClient.invalidateQueries({ queryKey: teamsOverviewQueryKeys.lists })
      queryClient.invalidateQueries({ queryKey: teamsOverviewQueryKeys.detail(vars.teamKey) })
    },
  })

  return mutation
}
