import { useMutation, useQueryClient } from '@tanstack/react-query'
import { financeApi } from './finance.api'
import { financeQueryKeys, type MemberFeePaymentStatus } from './finance.types'

export type SetEventFeeStatusInput = {
  userIds: string[]
  status: MemberFeePaymentStatus
}

/**
 * Writes one fee status for one or many members.
 *
 * Backs both entry points on the "Taxa por Membro" page: the row's review
 * dialog, which sends one id and whichever status the treasurer picked, and the
 * bulk bar, which sends a selection and `paid`. One hook because they are one
 * write — a second hook would be a second place to keep the invalidation right.
 *
 * Invalidates everything under the `finance` key rather than the member list
 * alone: a status change moves the by-team overview too, and those two pages are
 * one click apart in the sidebar.
 */
export function useSetEventFeeStatusMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: SetEventFeeStatusInput) =>
      financeApi.setEventFeePaymentsStatus(input.userIds, input.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all })
    },
  })

  return mutation
}
