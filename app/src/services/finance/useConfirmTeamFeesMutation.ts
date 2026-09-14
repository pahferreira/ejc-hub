import { useMutation, useQueryClient } from '@tanstack/react-query'
import { financeApi } from './finance.api'
import { financeQueryKeys } from './finance.types'
import { teamsOverviewQueryKeys } from '../teams/teams.types'

/**
 * Confirms one or many of the caller's own team members' fees as paid.
 *
 * Invalidates the team keys as well as the finance ones, unlike its admin
 * sibling: the coordinator page reads its rows from the team detail endpoint,
 * so dropping only `finance` would leave the rows it just confirmed still
 * showing "Pendente". The finance keys still matter — a treasurer looking at
 * the by-team overview in another tab is one confirmation behind otherwise.
 */
export function useConfirmTeamFeesMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (userIds: string[]) => financeApi.confirmTeamFeePayments(userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: teamsOverviewQueryKeys.myTeam })
    },
  })

  return mutation
}
