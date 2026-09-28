import { useMutation, useQueryClient } from '@tanstack/react-query'
import { memberRequestsApi } from './member-requests.api'
import {
  memberRequestQueryKeys,
  type RequestableCandidateFilters,
  type RequestableCandidateList,
  type RequestPagination,
} from './member-requests.types'

type CreateMemberRequestInput = {
  userId: string
  message?: string
}

type MutationContext = {
  previous: RequestableCandidateList | undefined
}

/**
 * Files one request, optimistically flipping the row to `requested` on the
 * exact active list — the table's current filters and page — rather than
 * waiting on a refetch (plan G.6).
 *
 * Deliberately does not re-sort the optimistic result: the row's tier changes,
 * and re-sorting client-side would yank it to the top of the table the instant
 * the modal closes, under the cursor about to click the next row. The next
 * server fetch (`onSettled`) reorders it, which is the moment the coordinator
 * is looking at the whole table again rather than at one row.
 */
export function useCreateMemberRequestMutation(
  filters: RequestableCandidateFilters,
  pagination: RequestPagination
) {
  const queryClient = useQueryClient()
  const queryKey = memberRequestQueryKeys.requestableMembersList(filters, pagination)

  return useMutation({
    mutationFn: (input: CreateMemberRequestInput) =>
      memberRequestsApi.createMemberRequests([input.userId], input.message),
    onMutate: async (input): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<RequestableCandidateList>(queryKey)

      queryClient.setQueryData<RequestableCandidateList>(queryKey, (current) => {
        if (!current) {
          return current
        }

        const pendingRequests = current.stats.pendingRequests + 1

        return {
          ...current,
          stats: {
            ...current.stats,
            pendingRequests,
            freeSlotsIfAllApproved: Math.max(0, current.stats.freeSlots - pendingRequests),
          },
          items: current.items.map((item) =>
            item.userId === input.userId ? { ...item, rowStatus: 'requested' } : item
          ),
        }
      })

      return { previous }
    },
    // Restores the snapshot; the API message reaches the coordinator through
    // `toastPromise` at the call site, which is also where
    // `member_already_assigned` is mapped to its pt-BR copy.
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: memberRequestQueryKeys.all })
    },
  })
}
