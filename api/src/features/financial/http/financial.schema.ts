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

export type ConfirmFeeBody = z.infer<typeof confirmFeeBodySchema>
export type ConfirmFeesBatchBody = z.infer<typeof confirmFeesBatchBodySchema>
export type SetFeeStatusBody = z.infer<typeof setFeeStatusBodySchema>
export type SetFeeStatusBatchBody = z.infer<typeof setFeeStatusBatchBodySchema>
