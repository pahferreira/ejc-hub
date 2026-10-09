import { useMutation, useQueryClient } from '@tanstack/react-query'
import { memberRequestsApi } from './member-requests.api'
import { memberRequestQueryKeys, type SettableRequestStatus } from './member-requests.types'

type ResolveMemberRequestInput = {
  requestId: string
  status: SettableRequestStatus
  resolutionReason?: string
}

/**
 * Approve or deny, one request at a time — there is no batch route, by design.
 *
 * **Deliberately not optimistic**, unlike the coordinator's
 * `useCreateMemberRequestMutation`. The difference is blast radius: approving a
 * contested request closes every rival in the same transaction, so one click
 * can change N+1 rows — some of them on pages the client does not hold — and
 * three of the four card counts. Patching that by hand would show an admin a
 * queue that disagrees with the database in exactly the case that matters
 * (plan H.8).
 *
 * `placeholderData` on the queue query covers the only thing the optimistic
 * write was buying: the table does not blank while the refetch lands.
 */
export function useResolveMemberRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ResolveMemberRequestInput) =>
      memberRequestsApi.resolveMemberRequest(input.requestId, input.status, input.resolutionReason),
    // Invalidated on settle, not on success: a 422 means a concurrent approval
    // placed the person first, so the row the admin clicked is now `outdated`
    // and must not stay on screen with live buttons inviting the same click
    // (plan H.2).
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: memberRequestQueryKeys.all })
    },
  })
}
