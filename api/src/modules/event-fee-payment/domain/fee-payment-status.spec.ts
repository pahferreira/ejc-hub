import { describe, it, expect } from 'vitest'
import { buildFeePaymentStatusFields, SETTABLE_FEE_STATUSES } from './fee-payment-status.ts'

const NOW = new Date('2026-09-08T12:00:00.000Z')

describe('buildFeePaymentStatusFields', () => {
  it('stamps the payment time when marking someone paid', () => {
    expect(buildFeePaymentStatusFields('paid', NOW)).toEqual({ status: 'paid', paidAt: NOW })
  })

  it('leaves the payment method untouched when marking someone paid', () => {
    // Absent, not null: a treasurer who already recorded "pix" keeps it.
    expect(buildFeePaymentStatusFields('paid', NOW)).not.toHaveProperty('method')
  })

  it.each(['pending', 'not_paid', 'exempt'] as const)(
    'clears the payment time and method for %s',
    (status) => {
      expect(buildFeePaymentStatusFields(status, NOW)).toEqual({
        status,
        paidAt: null,
        method: null,
      })
    }
  )

  it('never leaves a paid timestamp on a status that did not collect money', () => {
    const notCollected = SETTABLE_FEE_STATUSES.filter((status) => status !== 'paid')

    for (const status of notCollected) {
      expect(buildFeePaymentStatusFields(status, NOW).paidAt).toBeNull()
    }
  })

  it('excludes refunded, which has nowhere to record when the money went back', () => {
    expect(SETTABLE_FEE_STATUSES).not.toContain('refunded')
  })
})
