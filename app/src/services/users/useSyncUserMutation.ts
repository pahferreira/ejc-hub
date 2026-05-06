import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from './users.api'
import { currentUserQueryKey } from './currentUser.queryKeys'

export function useSyncUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.syncUser,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user)
    },
  })
}
