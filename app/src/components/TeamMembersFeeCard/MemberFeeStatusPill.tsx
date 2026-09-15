import { FiCheckCircle, FiGift, FiXCircle } from 'react-icons/fi'
import { Badge } from '../Badge/Badge'
import type {
  MemberFeePaymentStatus,
  TeamMemberFeeStatus,
} from '../../services/finance/finance.types'
import type { BadgeVariant } from '../Badge/Badge'

export type MemberFeeStatusPillProps = {
  /**
   * Either reading of a member's fee: the folded standing the lists carry, or
   * the stored status the review dialog works with. The folded values are a
   * subset of the stored ones, so one component covers both and a caller cannot
   * accidentally render a second vocabulary for the same fact.
   */
  status: TeamMemberFeeStatus | MemberFeePaymentStatus
}

const statusPresentation: Record<
  MemberFeePaymentStatus,
  { label: string; variant: BadgeVariant; icon: typeof FiCheckCircle }
> = {
  paid: { label: 'Pago', variant: 'success', icon: FiCheckCircle },
  // Settled like `paid` but not the same event, so it gets its own colour: a
  // treasurer reconciling money received must be able to spot the comped rows.
  exempt: { label: 'Isento', variant: 'info', icon: FiGift },
  pending: { label: 'Pendente', variant: 'error', icon: FiXCircle },
  not_paid: { label: 'Não pago', variant: 'error', icon: FiXCircle },
}

/**
 * Reuses `Badge` rather than styling a pill, so the green/red/blue here are the
 * same `--green`/`--red`/`--blue` tokens the team-level fee card already uses.
 */
export function MemberFeeStatusPill(props: MemberFeeStatusPillProps) {
  const presentation = statusPresentation[props.status]
  const Icon = presentation.icon

  return (
    <Badge variant={presentation.variant}>
      <span className="inline-flex items-center gap-1">
        <Icon aria-hidden="true" size={12} />
        {presentation.label}
      </span>
    </Badge>
  )
}
