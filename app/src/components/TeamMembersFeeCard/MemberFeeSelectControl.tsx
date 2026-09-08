import { FiCheckCircle } from 'react-icons/fi'
import { Checkbox } from '../Checkbox/Checkbox'
import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

export type MemberFeeSelectControlProps = {
  member: TeamMemberFeeRow
  isSelected: boolean
  onToggle: (memberId: string) => void
}

/**
 * The leading control of a member row, in both the table and the stacked mobile
 * layout — the "only pending members are selectable" rule lives here once so the
 * two layouts cannot disagree about it.
 *
 * A paid member gets a decorative marker rather than a disabled checkbox: there
 * is nothing to confirm, and the row's status pill already says "Pago" in text,
 * so hiding the icon from assistive tech drops no information.
 */
export function MemberFeeSelectControl(props: MemberFeeSelectControlProps) {
  if (props.member.status === 'paid') {
    return (
      <span aria-hidden="true" className="inline-flex text-gray-400">
        <FiCheckCircle size={16} />
      </span>
    )
  }

  return (
    <Checkbox
      hideLabel
      label={`Selecionar ${props.member.nickname}`}
      checked={props.isSelected}
      onChange={() => props.onToggle(props.member.userId)}
    />
  )
}
