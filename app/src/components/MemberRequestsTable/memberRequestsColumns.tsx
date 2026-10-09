import { createColumnHelper } from '@tanstack/react-table'
import { Badge } from '../Badge/Badge'
import { TeamAvatar } from '../TeamAvatar/TeamAvatar'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { DisputedBadge } from './DisputedBadge'
import { MemberRequestRowActions } from './MemberRequestRowActions'
import { memberRequestStatusDisplay } from '../../services/member-requests/memberRequestStatusDisplay'
import { pluralize } from '../../utils/pluralize/pluralize'
import type { MemberRequestQueueRow } from '../../services/member-requests/member-requests.types'

export type MemberRequestsColumnsOptions = {
  onApprove: (row: MemberRequestQueueRow) => void
  onDeny: (row: MemberRequestQueueRow) => void
  /**
   * Whether the viewer may approve or deny.
   *
   * When false the `AÇÃO` column is dropped entirely rather than rendered with
   * disabled buttons: a header over affordances nobody has claims something
   * that is not there (plan H.7, matching `eventFeeMembersColumns`).
   */
  canResolve: boolean
}

const columnHelper = createColumnHelper<MemberRequestQueueRow>()

/**
 * A factory, not a module-level array: the action cells close over the live
 * `onApprove` / `onDeny` callbacks, and the last column's presence depends on
 * the viewer's permissions.
 */
export function createMemberRequestsColumns(options: MemberRequestsColumnsOptions) {
  const actionColumn = columnHelper.display({
    id: 'actions',
    header: 'Ação',
    meta: { className: 'text-right' },
    cell: (info) => (
      <MemberRequestRowActions
        row={info.row.original}
        onApprove={options.onApprove}
        onDeny={options.onDeny}
      />
    ),
  })

  return [
    columnHelper.accessor((row) => row.user.nickname, {
      id: 'member',
      header: 'Novo Membro',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            name={info.row.original.user.name}
            pictureUrl={info.row.original.user.pictureUrl}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-dark-brown">{info.getValue()}</span>
              <DisputedBadge otherPendingCount={info.row.original.otherPendingRequests.length} />
            </div>
            <span className="text-xs font-medium text-secondary-foreground">
              {info.row.original.user.name}
            </span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.team.name, {
      id: 'team',
      header: 'Equipe Solicitante',
      cell: (info) => {
        const { freeSlots } = info.row.original.team

        return (
          <div className="flex items-center gap-3">
            <TeamAvatar name={info.getValue()} size="sm" />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-semibold text-dark-brown">{info.getValue()}</span>
              {/* Display only, and may be stale — capacity is never enforced
                  on approve (plan D12). */}
              <span className="text-xs font-medium text-secondary-foreground">
                {freeSlots} {pluralize(freeSlots, 'vaga restante', 'vagas restantes')}
              </span>
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor((row) => row.requestedBy.name, {
      id: 'requestedBy',
      header: 'Solicitado por',
      cell: (info) => <span className="text-sm text-dark-brown">{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const display = memberRequestStatusDisplay[info.getValue()]

        return <Badge variant={display.variant}>{display.label}</Badge>
      },
    }),
    ...(options.canResolve ? [actionColumn] : []),
  ]
}
