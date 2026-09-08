import { FiPhone } from 'react-icons/fi'
import { MemberFeeConfirmAction } from './MemberFeeConfirmAction'
import { MemberFeeIdentity } from './MemberFeeIdentity'
import { MemberFeeSelectControl } from './MemberFeeSelectControl'
import { MemberFeeStatusPill } from './MemberFeeStatusPill'
import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

export type FeeMemberListItemProps = {
  member: TeamMemberFeeRow
  isSelected: boolean
  onToggle: (memberId: string) => void
  onConfirm: (memberId: string) => void
}

/**
 * The narrow-viewport stand-in for a table row, following `FeeTeamListItem`:
 * five columns do not survive a phone, so the same information stacks. The
 * selection control stays on the leading edge, where it is in the table, and
 * the status pill and action share the bottom line so the tap targets do not
 * crowd the identity block.
 */
export function FeeMemberListItem(props: FeeMemberListItemProps) {
  return (
    <li className="flex flex-col gap-3 px-6 py-4">
      <div className="flex items-start gap-3">
        <span className="pt-3">
          <MemberFeeSelectControl
            member={props.member}
            isSelected={props.isSelected}
            onToggle={props.onToggle}
          />
        </span>
        <MemberFeeIdentity member={props.member} />
      </div>

      {props.member.phone && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-secondary-foreground">
          <FiPhone aria-hidden="true" size={12} className="shrink-0" />
          {props.member.phone}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <MemberFeeStatusPill status={props.member.status} />
        <MemberFeeConfirmAction member={props.member} onConfirm={props.onConfirm} />
      </div>
    </li>
  )
}
