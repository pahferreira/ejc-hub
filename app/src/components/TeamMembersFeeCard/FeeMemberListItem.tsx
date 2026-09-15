import type { ReactNode } from 'react'
import { FiPhone } from 'react-icons/fi'
import { MemberFeeIdentity } from './MemberFeeIdentity'
import { MemberFeeSelectControl } from './MemberFeeSelectControl'
import { MemberFeeStatusPill } from './MemberFeeStatusPill'
import { TeamAvatar } from '../TeamAvatar/TeamAvatar'
import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

export type FeeMemberListItemProps = {
  member: TeamMemberFeeRow
  isSelected: boolean
  onToggle: (memberId: string) => void
  /**
   * The row's trailing action, rendered beside the status pill.
   *
   * A slot rather than a callback, the way `PersonCard` takes its chips: the two
   * lists that use this row disagree about what the action *is* — a coordinator
   * confirms a pending payment, a treasurer reviews any status — and that is
   * their decision to make, not a flag for this component to branch on. Omitted
   * renders no action at all.
   */
  action?: ReactNode
  /**
   * The member's team, for lists that mix several. Omitted by the coordinator's
   * own-team card, where every row would repeat the same name.
   */
  team?: { key: string; name: string }
  /**
   * Drops the selection control, leaving the row purely informational. For
   * callers whose user may read fees but not settle them; such a caller passes
   * no `action` either.
   */
  readOnly?: boolean
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
        {!props.readOnly && (
          <span className="pt-3">
            <MemberFeeSelectControl
              member={props.member}
              isSelected={props.isSelected}
              onToggle={props.onToggle}
            />
          </span>
        )}
        <MemberFeeIdentity member={props.member} />
      </div>

      {props.team && (
        <span className="inline-flex items-center gap-2">
          {/* Decorative: the name beside it already carries the information. */}
          <span aria-hidden="true">
            <TeamAvatar name={props.team.name} size="sm" />
          </span>
          <span className="font-medium text-dark-brown">{props.team.name}</span>
        </span>
      )}

      {props.member.phone && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-secondary-foreground">
          <FiPhone aria-hidden="true" size={12} className="shrink-0" />
          {props.member.phone}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <MemberFeeStatusPill status={props.member.status} />
        {props.action}
      </div>
    </li>
  )
}
