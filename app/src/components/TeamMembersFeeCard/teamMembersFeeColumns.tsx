import { createColumnHelper } from '@tanstack/react-table'
import { MemberFeeConfirmAction } from './MemberFeeConfirmAction'
import { MemberFeeIdentity } from './MemberFeeIdentity'
import { MemberFeeSelectControl } from './MemberFeeSelectControl'
import { MemberFeeStatusPill } from './MemberFeeStatusPill'
import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

// The `ColumnMeta.className` augmentation these columns rely on is declared once
// in `../FeeByTeamCard/feeByTeamColumns.tsx`; module augmentation is global, so
// redeclaring it here would only risk the two drifting apart.

export type TeamMembersFeeColumnsOptions = {
  selectedIds: string[]
  onToggleMember: (memberId: string) => void
  onConfirmMember: (memberId: string) => void
}

const columnHelper = createColumnHelper<TeamMemberFeeRow>()

/**
 * A factory rather than the module-level array `feeByTeamColumns` uses: these
 * cells need the live selection and the row callbacks, which a constant defined
 * at import time cannot close over.
 */
export function createTeamMembersFeeColumns(options: TeamMembersFeeColumnsOptions) {
  return [
    columnHelper.display({
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
    }),
    columnHelper.accessor('nickname', {
      header: 'Membro',
      cell: (info) => <MemberFeeIdentity member={info.row.original} />,
    }),
    columnHelper.accessor('phone', {
      header: 'Contato',
      cell: (info) => info.getValue() ?? <span className="text-gray-400">—</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => <MemberFeeStatusPill status={info.getValue()} />,
    }),
    columnHelper.display({
      id: 'action',
      header: 'Ação',
      meta: { className: 'text-right' },
      cell: (info) => (
        <MemberFeeConfirmAction member={info.row.original} onConfirm={options.onConfirmMember} />
      ),
    }),
  ]
}
