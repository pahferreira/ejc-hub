import { useQuery } from '@tanstack/react-query'
import { teamBuildingApi } from './team-building.api'
import { teamBuildingQueryKeys } from './team-building.types'

export function useCurrentEventBoardQuery() {
  const query = useQuery({
    queryKey: teamBuildingQueryKeys.board,
    queryFn: teamBuildingApi.getCurrentEventBoard,
  })

  return query
}
