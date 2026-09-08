import { Button } from '../Button/Button'
import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

export type MemberFeeConfirmActionProps = {
  member: TeamMemberFeeRow
  onConfirm: (memberId: string) => void
}

/**
 * The per-row action, shared by the table and the stacked mobile layout. A paid
 * member has nothing to confirm, so the slot holds an em dash to keep the
 * column's rhythm rather than collapsing.
 */
export function MemberFeeConfirmAction(props: MemberFeeConfirmActionProps) {
  if (props.member.status === 'paid') {
    return (
      <span aria-hidden="true" className="text-gray-400">
        —
      </span>
    )
  }

  return (
    <Button
      variant="secondary"
      ariaLabel={`Confirmar taxa de ${props.member.nickname}`}
      onClick={() => props.onConfirm(props.member.userId)}
    >
      <span className="inline-flex items-center gap-1.5">Confirmar</span>
    </Button>
  )
}
