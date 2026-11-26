import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { teamBuildingApi } from './team-building.api'
import { teamBuildingQueryKeys } from './team-building.types'
import { teamsOverviewQueryKeys } from '../teams/teams.types'
import { attendanceQueryKeys } from '../attendance/attendance.types'

type AddMembersVars = {
  teamInstanceId: string
  userIds: string[]
}

/** The queries a change to a team's members leaves stale. */
export function addMembersStaleKeys(teamInstanceId: string): QueryKey[] {
  return [
    teamsOverviewQueryKeys.stats,
    teamsOverviewQueryKeys.lists,
    teamsOverviewQueryKeys.details,
    teamBuildingQueryKeys.teamCandidates(teamInstanceId),
    attendanceQueryKeys.team(teamInstanceId),
  ]
}

export function useAddMembersMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (vars: AddMembersVars) =>
      teamBuildingApi.addMembers(vars.teamInstanceId, vars.userIds),
    onSuccess: (_, vars) => {
      for (const queryKey of addMembersStaleKeys(vars.teamInstanceId)) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  return mutation
}
