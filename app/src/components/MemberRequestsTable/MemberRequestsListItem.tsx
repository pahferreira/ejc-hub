import { Badge } from '../Badge/Badge'
import { TeamAvatar } from '../TeamAvatar/TeamAvatar'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { DisputedBadge } from './DisputedBadge'
import { MemberRequestRowActions } from './MemberRequestRowActions'
import { memberRequestStatusDisplay } from '../../services/member-requests/memberRequestStatusDisplay'
import { pluralize } from '../../utils/pluralize/pluralize'
import type { MemberRequestQueueRow } from '../../services/member-requests/member-requests.types'

export type MemberRequestsListItemProps = {
  row: MemberRequestQueueRow
  onApprove: (row: MemberRequestQueueRow) => void
  onDeny: (row: MemberRequestQueueRow) => void
  /** Mirrors the desktop column's permission gate — see `memberRequestsColumns`. */
  canResolve: boolean
}

/**
 * One request on a phone, where the five desktop columns stack.
 *
 * Carries the same facts in the same order as the table row, so an admin
 * switching devices reads the queue the same way.
 */
export function MemberRequestsListItem(props: MemberRequestsListItemProps) {
  const status = memberRequestStatusDisplay[props.row.status]
  const { freeSlots } = props.row.team

  return (
    <li className="flex flex-col gap-3 px-6 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={props.row.user.name} pictureUrl={props.row.user.pictureUrl} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-dark-brown">{props.row.user.nickname}</span>
              <DisputedBadge otherPendingCount={props.row.otherPendingRequests.length} />
            </div>
            <span className="text-xs font-medium text-secondary-foreground">
              {props.row.user.name}
            </span>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="flex items-center gap-2">
        <TeamAvatar name={props.row.team.name} size="sm" />
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-dark-brown">{props.row.team.name}</span>
          <span className="text-xs text-secondary-foreground">
            {freeSlots} {pluralize(freeSlots, 'vaga restante', 'vagas restantes')}
          </span>
        </div>
      </div>

      <span className="text-xs text-secondary-foreground">
        Solicitado por {props.row.requestedBy.name}
      </span>

      {props.canResolve && (
        <MemberRequestRowActions
          row={props.row}
          onApprove={props.onApprove}
          onDeny={props.onDeny}
        />
      )}
    </li>
  )
}
