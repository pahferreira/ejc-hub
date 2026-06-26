import { useMutation, useQueryClient } from '@tanstack/react-query'
import { teamBuildingApi } from './team-building.api'
import { teamBuildingQueryKeys, type AssignmentChange } from './team-building.types'

export function useApplyAssignmentsMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (assignments: AssignmentChange[]) => teamBuildingApi.applyAssignments(assignments),
    onSuccess: (board) => {
      // The endpoint returns the recomputed board, so seed the cache with it.
      queryClient.setQueryData(teamBuildingQueryKeys.board, board)
    },
  })

  return mutation
}
