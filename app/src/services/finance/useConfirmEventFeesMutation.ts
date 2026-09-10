import { useMutation, useQueryClient } from '@tanstack/react-query'
import { financeApi } from './finance.api'
import { financeQueryKeys } from './finance.types'

/**
 * Confirms one or many members' fees as paid.
 *
 * Invalidates everything under the `finance` key rather than the member list
 * alone: a confirmation moves the by-team overview too, and those two pages are
 * one click apart in the sidebar.
 */
export function useConfirmEventFeesMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (userIds: string[]) => financeApi.confirmEventFeePayments(userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all })
    },
  })

  return mutation
}
