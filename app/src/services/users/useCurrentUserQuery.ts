import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SyncedUser } from './users.types'
import { currentUserQueryKey } from './currentUser.queryKeys'

export function useCurrentUserQuery() {
  const queryClient = useQueryClient()
  const query = useQuery<SyncedUser | undefined>({
    queryKey: currentUserQueryKey,
    queryFn: () => queryClient.getQueryData<SyncedUser>(currentUserQueryKey),
    enabled: false,
    staleTime: Infinity,
  })

  return {
    data: query.data,
    isReady: query.data !== undefined,
  }
}
