import { Button } from '../Button/Button'
import type { EventFeeMemberRow } from '../../services/finance/finance.types'

export type MemberFeeReviewActionProps = {
  member: EventFeeMemberRow
  onReview: (memberId: string) => void
}

/**
 * The treasurer's per-row action, in the table and in the stacked mobile layout.
 *
 * Offered on every row, unlike the coordinator's `MemberFeeConfirmAction`, which
 * blanks out once a member is settled. A settled row is precisely where this is
 * needed: reversing a confirmation entered against the wrong person, or turning
 * a payment into an exemption, has nowhere else to happen.
 */
export function MemberFeeReviewAction(props: MemberFeeReviewActionProps) {
  return (
    <Button
      variant="secondary"
      ariaLabel={`Revisar taxa de ${props.member.nickname}`}
      onClick={() => props.onReview(props.member.userId)}
    >
      Revisar
    </Button>
  )
}
