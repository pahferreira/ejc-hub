import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { Badge } from '../Badge/Badge'
import type { TeamMemberFeeStatus } from '../../services/finance/finance.types'

export type MemberFeeStatusPillProps = {
  status: TeamMemberFeeStatus
}

/**
 * Reuses `Badge` rather than styling a pill, so the green/red here are the same
 * `--green`/`--red` tokens the team-level fee card already uses.
 */
export function MemberFeeStatusPill(props: MemberFeeStatusPillProps) {
  const isPaid = props.status === 'paid'

  return (
    <Badge variant={isPaid ? 'success' : 'error'}>
      <span className="inline-flex items-center gap-1">
        {isPaid ? (
          <FiCheckCircle aria-hidden="true" size={12} />
        ) : (
          <FiXCircle aria-hidden="true" size={12} />
        )}
        {isPaid ? 'Pago' : 'Pendente'}
      </span>
    </Badge>
  )
}
