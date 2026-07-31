import { useQuery } from '@tanstack/react-query'
import { teamsApi } from './teams.api'
import { teamsOverviewQueryKeys } from './teams.types'

export function useTeamDetailQuery(teamKey: string | undefined) {
  const query = useQuery({
    queryKey: teamsOverviewQueryKeys.detail(teamKey ?? ''),
    queryFn: () => teamsApi.getCurrentEventTeamDetail(teamKey!),
    enabled: Boolean(teamKey),
  })

  return query
}
