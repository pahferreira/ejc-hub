import { useMutation } from '@tanstack/react-query'
import { usersApi } from './users.api'

export function useSyncUserMutation() {
  const mutation = useMutation({
    mutationFn: usersApi.syncUser,
  })

  return mutation
}
