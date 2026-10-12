import { Badge } from '../Badge/Badge'
import { Card } from '../Card/Card'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { memberRequestStatusDisplay } from '../../services/member-requests/memberRequestStatusDisplay'
import { formatShortDate } from '../../utils/formatShortDate/formatShortDate'
import type {
  MemberRequestStatus,
  MyTeamRequestRow,
} from '../../services/member-requests/member-requests.types'

export type MyTeamRequestCardProps = {
  row: MyTeamRequestRow
}

/**
 * What the response panel says when there is no `resolutionReason` to show.
 *
 * `outdated` never reaches here — its reason is system-written ("Alocado em
 * outra equipe"), so the real text renders instead (plan: no special case
 * needed). `denied` is required a reason by the UI, but the contract leaves it
 * optional, so the fallback still covers it defensively.
 */
function responsePlaceholder(status: MemberRequestStatus): string {
  if (status === 'pending') {
    return 'Aguardando resposta da administração.'
  }

  if (status === 'cancelled') {
    return 'Solicitação cancelada.'
  }

  return 'Sem observações.'
}

/**
 * One request on the coordinator's own list: who was asked for and why, next
 * to how it was answered.
 *
 * Two panels, left to right — the ask and the answer. The right panel shows
 * only `resolutionReason`; `resolvedBy` is deliberately left off (the admin's
 * name is not rendered on this page yet).
 *
 * Reuses `UserAvatar` / `Badge` / `Card` as-is rather than re-deriving their
 * styles, matching `MemberRequestsListItem`'s visual language.
 */
export function MyTeamRequestCard(props: MyTeamRequestCardProps) {
  const status = memberRequestStatusDisplay[props.row.status]
  const memberName = props.row.user.nickname || props.row.user.name

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row min-w-0 flex-1 justify-between gap-3 w-full">
          <div className="flex gap-3">
            <UserAvatar name={props.row.user.name} pictureUrl={props.row.user.pictureUrl} />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-semibold text-dark-brown">{memberName}</span>
              <span className="text-xs font-medium text-secondary-foreground">
                {props.row.user.name}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-xs text-secondary-foreground">
              Enviada em {formatShortDate(props.row.requestedAt)}{' '}
              {props.row.resolvedAt
                ? `· Respondida em ${formatShortDate(props.row.resolvedAt)}`
                : ''}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-tertiary px-4 py-3 w-full">
            <span className="text-xs font-semibold tracking-wide text-dark-brown uppercase">
              Motivo da Solicitação
            </span>
            {props.row.message && (
              <p className="m-0 mt-1 text-sm text-text-primary italic">{props.row.message}</p>
            )}
          </div>
          <div className="rounded-lg border border-secondary bg-sidebar-background px-4 py-3 w-full">
            <span className="text-xs font-semibold tracking-wide text-dark-brown uppercase">
              Resposta dos Jotas
            </span>
            <p className="m-0 mt-1 text-sm text-dark-brown italic">
              {props.row.resolutionReason ?? responsePlaceholder(props.row.status)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
