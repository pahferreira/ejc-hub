import { describe, it, expect } from 'vitest'
import {
  buildFeePaymentStatusFields,
  SETTABLE_FEE_STATUSES,
  toMemberFeeStanding,
  toSettableFeeStatus,
} from './fee-payment-status.ts'

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

describe('toMemberFeeStanding', () => {
  it('reads a paid fee as settled', () => {
    expect(toMemberFeeStanding('paid')).toBe('paid')
  })

  it('reads a comped fee as settled, since the member owes nothing', () => {
    expect(toMemberFeeStanding('exempt')).toBe('paid')
  })

  it.each(['pending', 'not_paid', 'refunded'] as const)('reads %s as outstanding', (status) => {
    expect(toMemberFeeStanding(status)).toBe('pending')
  })

  it('reads a member with no payment row at all as outstanding', () => {
    expect(toMemberFeeStanding(null)).toBe('pending')
    expect(toMemberFeeStanding(undefined)).toBe('pending')
  })
})

describe('toSettableFeeStatus', () => {
  it.each(SETTABLE_FEE_STATUSES)('passes %s through untouched', (status) => {
    expect(toSettableFeeStatus(status)).toBe(status)
  })

  it('keeps a comped fee distinct from a paid one, unlike the standing fold', () => {
    // The whole reason this exists next to `toMemberFeeStanding`: a review
    // dialog that cannot tell the two apart cannot preselect the right option.
    expect(toSettableFeeStatus('exempt')).toBe('exempt')
    expect(toMemberFeeStanding('exempt')).toBe('paid')
  })

  it('reads a member with no payment row as pending', () => {
    expect(toSettableFeeStatus(null)).toBe('pending')
    expect(toSettableFeeStatus(undefined)).toBe('pending')
  })

  it('reads refunded as pending, since no screen can set it back', () => {
    expect(toSettableFeeStatus('refunded')).toBe('pending')
  })

  it('reads an unknown status as pending rather than trusting the column', () => {
    expect(toSettableFeeStatus('something_else')).toBe('pending')
  })
})
