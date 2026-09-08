import { describe, expect, it } from 'vitest'
import { getMemberFeeCounts } from './feeMemberStats'
import { buildMemberFeeRow, mixedMemberFeeRows } from './feeMemberMocks'

describe('getMemberFeeCounts', () => {
  it('counts paid and pending members separately', () => {
    const counts = getMemberFeeCounts(mixedMemberFeeRows)

    expect(counts.total).toBe(8)
    expect(counts.paid).toBe(5)
    expect(counts.pending).toBe(3)
  })

  it('rounds the percentage of a mixed team', () => {
    // 5 of 8 is 62.5%, which the footer shows as 63%.
    expect(getMemberFeeCounts(mixedMemberFeeRows).paidPercentage).toBe(63)
  })

  it('returns 100% when every member has paid', () => {
    const rows = [
      buildMemberFeeRow({ userId: 'a', name: 'Ana Lima', status: 'paid' }),
      buildMemberFeeRow({ userId: 'b', name: 'Bruno Reis', status: 'paid' }),
    ]

    expect(getMemberFeeCounts(rows)).toEqual({
      total: 2,
      paid: 2,
      pending: 0,
      paidPercentage: 100,
    })
  })

  it('returns 0% when every member is still pending', () => {
    const rows = [
      buildMemberFeeRow({ userId: 'a', name: 'Ana Lima' }),
      buildMemberFeeRow({ userId: 'b', name: 'Bruno Reis' }),
    ]

    expect(getMemberFeeCounts(rows)).toEqual({
      total: 2,
      paid: 0,
      pending: 2,
      paidPercentage: 0,
    })
  })

  it('returns zeroed counts for an empty team instead of NaN', () => {
    expect(getMemberFeeCounts([])).toEqual({
      total: 0,
      paid: 0,
      pending: 0,
      paidPercentage: 0,
    })
  })
})
