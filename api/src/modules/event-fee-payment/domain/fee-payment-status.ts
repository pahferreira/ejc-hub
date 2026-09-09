/**
 * The statuses a treasurer can set directly.
 *
 * `refunded` is deliberately absent: the table has no `refunded_at`, so a refund
 * would either overwrite `paid_at` (losing when the money actually came in) or
 * leave no record of when it went back out. That needs a schema decision, not a
 * fifth entry here.
 */
export const SETTABLE_FEE_STATUSES = ['pending', 'not_paid', 'paid', 'exempt'] as const

export type SettableFeeStatus = (typeof SETTABLE_FEE_STATUSES)[number]

export type FeePaymentStatusFields = {
  status: SettableFeeStatus
  paidAt: Date | null
  /** Present only when the method must be cleared; absent leaves it untouched. */
  method?: null
}

/**
 * The whole set of row fields a status implies — not just the status column.
 *
 * Writing `status` alone corrupts the record: marking someone paid and then
 * correcting them to `not_paid` would leave a `not_paid` row still carrying a
 * `paid_at` timestamp and a payment method. Nothing errors, the data is simply
 * wrong, and it surfaces much later in a reconciliation nobody trusts.
 */
export function buildFeePaymentStatusFields(
  status: SettableFeeStatus,
  now: Date
): FeePaymentStatusFields {
  if (status === 'paid') {
    // `method` is left alone: this endpoint does not accept one, and a treasurer
    // who already recorded "pix" must not lose it by re-confirming the payment.
    return { status, paidAt: now }
  }

  // Nothing was collected, so the row must claim neither a date nor a method.
  return { status, paidAt: null, method: null }
}
