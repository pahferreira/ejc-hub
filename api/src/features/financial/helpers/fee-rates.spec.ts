import { describe, it, expect } from 'vitest'
import { toFeeRates } from './fee-rates.ts'

describe('toFeeRates', () => {
  it('converts each bucket to its whole-percentage share', () => {
    expect(toFeeRates({ paid: 50, exempt: 25, pending: 25 })).toEqual({
      paidPercentage: 50,
      exemptPercentage: 25,
      pendingPercentage: 25,
    })
  })

  it('still sums to 100 when every share is a repeating decimal', () => {
    const rates = toFeeRates({ paid: 1, exempt: 1, pending: 1 })

    // Independent rounding would give 33/33/33 and quietly lose a point.
    expect(rates.paidPercentage + rates.exemptPercentage + rates.pendingPercentage).toBe(100)
  })

  it('never exceeds 100 when the shares round up', () => {
    const rates = toFeeRates({ paid: 1, exempt: 1, pending: 4 })

    expect(rates.paidPercentage + rates.exemptPercentage + rates.pendingPercentage).toBe(100)
  })

  it('hands the leftover point to the bucket that was cut hardest', () => {
    // 1/6, 1/6, 4/6 -> 16.67, 16.67, 66.67. Flooring loses two points; the two
    // largest remainders are the tied 0.67s, and the tie breaks toward paid.
    expect(toFeeRates({ paid: 1, exempt: 1, pending: 4 })).toEqual({
      paidPercentage: 17,
      exemptPercentage: 17,
      pendingPercentage: 66,
    })
  })

  it('reports all zeros for an event with nobody on a team', () => {
    expect(toFeeRates({ paid: 0, exempt: 0, pending: 0 })).toEqual({
      paidPercentage: 0,
      exemptPercentage: 0,
      pendingPercentage: 0,
    })
  })

  it('gives a single fully-paid roster the whole hundred', () => {
    expect(toFeeRates({ paid: 9, exempt: 0, pending: 0 })).toEqual({
      paidPercentage: 100,
      exemptPercentage: 0,
      pendingPercentage: 0,
    })
  })
})
