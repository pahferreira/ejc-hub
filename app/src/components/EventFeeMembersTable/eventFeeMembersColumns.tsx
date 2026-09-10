import { createColumnHelper } from '@tanstack/react-table'
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge'
import { MemberFeeConfirmAction } from '../TeamMembersFeeCard/MemberFeeConfirmAction'
import { MemberFeeIdentity } from '../TeamMembersFeeCard/MemberFeeIdentity'
import { MemberFeeSelectControl } from '../TeamMembersFeeCard/MemberFeeSelectControl'
import { MemberFeeStatusPill } from '../TeamMembersFeeCard/MemberFeeStatusPill'
import { TeamAvatar } from '../TeamAvatar/TeamAvatar'
import type { EventFeeMemberRow } from '../../services/finance/finance.types'

// The `ColumnMeta.className` augmentation these columns rely on is declared once
// in `../FeeByTeamCard/feeByTeamColumns.tsx`; module augmentation is global, so
// redeclaring it here would only risk the two drifting apart.

export type EventFeeMembersColumnsOptions = {
  selectedIds: string[]
  onToggleMember: (memberId: string) => void
  onConfirmMember: (memberId: string) => void
  /**
   * Whether the viewer may settle a fee. When false the selection and action
   * columns are not rendered at all — an "Ação" header over a column of em
   * dashes claims an affordance that is not there, and a disabled checkbox
   * invites clicking. The read-only table is purely informational.
   */
  canConfirm: boolean
}

const columnHelper = createColumnHelper<EventFeeMemberRow>()

/**
 * A factory, not a module-level array: the cells close over the live selection,
 * the row callbacks, and whether the viewer may write at all.
 */
export function createEventFeeMembersColumns(options: EventFeeMembersColumnsOptions) {
  const selectionColumn = columnHelper.display({
    id: 'select',
    header: () => <span className="sr-only">Seleção</span>,
    meta: { className: 'w-12 pr-0' },
    cell: (info) => (
      <MemberFeeSelectControl
        member={info.row.original}
        isSelected={options.selectedIds.includes(info.row.original.userId)}
        onToggle={options.onToggleMember}
      />
    ),
  })

  const actionColumn = columnHelper.display({
    id: 'action',
    header: 'Ação',
    meta: { className: 'text-right' },
    cell: (info) => (
      <MemberFeeConfirmAction member={info.row.original} onConfirm={options.onConfirmMember} />
    ),
  })

  return [
    ...(options.canConfirm ? [selectionColumn] : []),
    columnHelper.accessor('nickname', {
      header: 'Nome',
      // The experience badge is suppressed here because "Experiência" has its
      // own column below; the coordinator badge stays, as nothing else shows it.
      cell: (info) => <MemberFeeIdentity member={info.row.original} hideExperienceBadge />,
    }),
    columnHelper.accessor('phone', {
      header: 'Contato',
      cell: (info) => info.getValue() ?? <span className="text-gray-400">—</span>,
    }),
    columnHelper.accessor('teamName', {
      header: 'Equipe',
      cell: (info) => (
        <span className="inline-flex items-center gap-2">
          {/* Decorative here: the avatar's own label would make a screen reader
              announce the team twice, since the name sits right beside it. */}
          <span aria-hidden="true">
            <TeamAvatar name={info.getValue()} size="sm" />
          </span>
          <span className="font-medium text-dark-brown">{info.getValue()}</span>
        </span>
      ),
    }),
    columnHelper.accessor('experienceType', {
      header: 'Experiência',
      // The shared badge, so the wording stays "Encontrista"/"Encontreiro" — the
      // app's own vocabulary — rather than a second set of labels for this page.
      cell: (info) => (
        <ExperienceBadge experienceType={info.getValue()} circleKey={info.row.original.circleKey} />
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => <MemberFeeStatusPill status={info.getValue()} />,
    }),
    ...(options.canConfirm ? [actionColumn] : []),
  ]
}
