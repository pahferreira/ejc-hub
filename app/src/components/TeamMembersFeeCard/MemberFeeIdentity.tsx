import { Badge } from '../Badge/Badge'
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

export type MemberFeeIdentityProps = {
  member: TeamMemberFeeRow
}

/**
 * Who a row is about: avatar, nickname, badges, full name.
 *
 * The experience badge is the shared `ExperienceBadge`, so the wording stays
 * "Encontrista"/"Encontreiro" — the app's own vocabulary — rather than a second
 * set of labels that could drift from the rest of the Teams pages.
 *
 * Coordinators are badged from `membershipType`, which mirrors the
 * `team_membership_type` enum, and read "Coordenador" for the same reason.
 */
export function MemberFeeIdentity(props: MemberFeeIdentityProps) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar name={props.member.name} pictureUrl={props.member.pictureUrl} size="default" />

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-dark-brown">{props.member.nickname}</span>
          <ExperienceBadge
            experienceType={props.member.experienceType}
            circleKey={props.member.circleKey}
          />
          {props.member.membershipType === 'coordinator' && (
            <Badge variant="default">Coordenador</Badge>
          )}
        </div>
        <span className="text-xs font-medium text-secondary-foreground">{props.member.name}</span>
      </div>
    </div>
  )
}
