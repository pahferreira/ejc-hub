import { z } from 'zod/v4'
import { SETTABLE_FEE_STATUSES } from '../../../modules/event-fee-payment/domain/fee-payment-status.ts'

export const confirmFeeBodySchema = z.object({
  userId: z.uuid(),
})

export const confirmFeesBatchBodySchema = z.object({
  userIds: z.array(z.uuid()).min(1, 'at least one member is required'),
})

// Derived from the domain list so a status added there cannot be silently
// rejected here — and `refunded` stays out of both.
const feeStatusSchema = z.enum(SETTABLE_FEE_STATUSES)

export const feePaymentUserParamsSchema = z.object({
  userId: z.uuid(),
})

export const setFeeStatusBodySchema = z.object({
  status: feeStatusSchema,
})

export const setFeeStatusBatchBodySchema = z.object({
  userIds: z.array(z.uuid()).min(1, 'at least one member is required'),
  status: feeStatusSchema,
})

/** Matches the cap the subscriptions list uses, so no route can be a bulk export. */
export const MAX_MEMBER_PAGE_SIZE = 100

/**
 * The member list's query string.
 *
 * Single-valued `teamKey` and `status`, not arrays: the page offers one select
 * each ("Todas as equipes" / "Todos os status"), and modelling them as arrays
 * would promise a multi-select the UI does not have. The subscriptions list is
 * the multi-select case and takes arrays for exactly that reason.
 *
 * `name` is trimmed to a non-empty string so a cleared search box, which sends
 * `name=`, is dropped rather than matching everything through an empty
 * `includes`.
 */
export const listEventFeeMembersQuerystringSchema = z.object({
  name: z.string().trim().min(1).optional(),
  teamKey: z.string().trim().min(1).optional(),
  status: z.enum(['paid', 'pending']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(MAX_MEMBER_PAGE_SIZE).optional(),
})

export type ListEventFeeMembersQuerystring = z.infer<typeof listEventFeeMembersQuerystringSchema>
export type ConfirmFeeBody = z.infer<typeof confirmFeeBodySchema>
export type ConfirmFeesBatchBody = z.infer<typeof confirmFeesBatchBodySchema>
export type SetFeeStatusBody = z.infer<typeof setFeeStatusBodySchema>
export type SetFeeStatusBatchBody = z.infer<typeof setFeeStatusBatchBodySchema>
