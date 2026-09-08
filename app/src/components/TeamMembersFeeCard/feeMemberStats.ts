import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

export type MemberFeeCounts = {
  total: number
  paid: number
  pending: number
  /** 0–100, rounded. */
  paidPercentage: number
}

/**
 * Aggregates a coordinator's own team into the numbers shown in the card footer.
 *
 * Unlike `TeamFeeRow.paidPercentage`, which the API rounds so clients cannot
 * disagree with it across many teams, this percentage is derived locally: the
 * total is exactly the number of rows on screen, so there is nothing to drift
 * from. If a member-level aggregate endpoint ever appears, prefer its number.
 */
export function getMemberFeeCounts(rows: TeamMemberFeeRow[]): MemberFeeCounts {
  const total = rows.length
  const paid = rows.filter((row) => row.status === 'paid').length
  const pending = total - paid

  return {
    total,
    paid,
    pending,
    // Guarded rather than left as 0/0, which would render "NaN%".
    paidPercentage: total === 0 ? 0 : Math.round((paid / total) * 100),
  }
}
