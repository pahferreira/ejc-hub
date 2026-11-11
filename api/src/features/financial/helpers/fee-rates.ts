import type { EventFeeRates } from '../domain/event-fee.types.ts'

type FeeBucketCounts = {
  paid: number
  exempt: number
  pending: number
}

/**
 * The three buckets as whole percentages that always sum to 100.
 *
 * Rounding each share independently is what a naive implementation does, and it
 * puts 33/33/33 on a page that claims to cover everyone. These land side by side
 * as three cards, so the missing — or extra — point is right there to be read.
 *
 * Largest remainder instead: floor every share, then hand the leftover points to
 * whichever buckets were cut hardest. Ties go to the earlier bucket, which makes
 * the result deterministic rather than dependent on sort stability.
 *
 * An empty roster is all zeros rather than 100% of nothing — there is no share
 * to describe, and showing "100% pendente" for an event with no members reads as
 * an alarm about a situation that does not exist.
 */
export function toFeeRates(counts: FeeBucketCounts): EventFeeRates {
  const total = counts.paid + counts.exempt + counts.pending

  if (total <= 0) {
    return { paidPercentage: 0, exemptPercentage: 0, pendingPercentage: 0 }
  }

  const shares = [
    { key: 'paidPercentage' as const, exact: (counts.paid / total) * 100 },
    { key: 'exemptPercentage' as const, exact: (counts.exempt / total) * 100 },
    { key: 'pendingPercentage' as const, exact: (counts.pending / total) * 100 },
  ]

  const floored = shares.map((share) => ({ ...share, whole: Math.floor(share.exact) }))
  const leftover = 100 - floored.reduce((sum, share) => sum + share.whole, 0)

  // Index breaks ties so two equal remainders always resolve the same way.
  const byRemainder = floored
    .map((share, index) => ({ ...share, index }))
    .sort((first, second) => {
      const remainder = second.exact - second.whole - (first.exact - first.whole)

      return remainder !== 0 ? remainder : first.index - second.index
    })

  const bumped = new Set(byRemainder.slice(0, leftover).map((share) => share.key))
  const rates: EventFeeRates = { paidPercentage: 0, exemptPercentage: 0, pendingPercentage: 0 }

  floored.forEach((share) => {
    rates[share.key] = share.whole + (bumped.has(share.key) ? 1 : 0)
  })

  return rates
}
