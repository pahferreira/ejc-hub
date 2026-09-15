import { useMemo } from 'react'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Badge } from '../Badge/Badge'
import { Checkbox } from '../Checkbox/Checkbox'
import { StatBlock } from '../StatBlock/StatBlock'
import { Table } from '../Table'
import { getFeeTone } from '../FeeByTeamCard/feeTone'
import { FeeMemberListItem } from './FeeMemberListItem'
import { createTeamMembersFeeColumns } from './teamMembersFeeColumns'
import { getMemberFeeCounts } from './feeMemberStats'
import { isAllPendingSelected } from './feeMemberSelection'
import { pluralize } from '../../utils/pluralize/pluralize'
import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

export type TeamMembersFeeCardProps = {
  /** The coordinator's own team members and their fee standing. */
  rows: TeamMemberFeeRow[]
  /**
   * Currently selected member ids. Owned by the caller because the bulk-action
   * bar is a viewport-fixed sibling rendered outside this card, and both must
   * read the same selection. `feeMemberSelection.ts` holds the update rules.
   */
  selectedIds: string[]
  onToggleMember: (memberId: string) => void
  onToggleSelectAllPending: () => void
  onConfirmMember: (memberId: string) => void
}

/**
 * A coordinator's view of their own team's event fees, with per-row and bulk
 * confirmation.
 *
 * Uses a bare `section` rather than `Card` for the same reason `FeeByTeamCard`
 * does: `Card` hardcodes its padding, which a full-bleed table and a tinted
 * footer strip cannot sit inside.
 */
export function TeamMembersFeeCard(props: TeamMembersFeeCardProps) {
  const counts = getMemberFeeCounts(props.rows)
  const allPendingSelected = isAllPendingSelected(props.rows, props.selectedIds)
  const isEmpty = props.rows.length === 0

  const columns = useMemo(
    () =>
      createTeamMembersFeeColumns({
        selectedIds: props.selectedIds,
        onToggleMember: props.onToggleMember,
        onConfirmMember: props.onConfirmMember,
      }),
    [props.selectedIds, props.onToggleMember, props.onConfirmMember]
  )

  const table = useReactTable({
    data: props.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="w-full overflow-hidden rounded-xl border border-tertiary bg-white shadow-md">
      <header className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
        <div className="flex flex-col">
          <h2 className="m-0 font-serif text-xl text-dark-brown">Membros da Equipe</h2>
          <p className="mt-1 text-sm text-gray-600">
            {counts.pending}{' '}
            {pluralize(counts.pending, 'pagamento pendente', 'pagamentos pendentes')} · selecione
            pendentes para confirmar todos de uma vez.
          </p>
        </div>

        {/* Disabled when there is nothing to select, so a fully settled team
            cannot toggle an empty selection on and off. */}
        <div className="inline-flex items-center rounded-full border border-tertiary bg-white px-3 py-1.5">
          <Checkbox
            label="Selecionar pendentes"
            checked={allPendingSelected}
            disabled={counts.pending === 0}
            onChange={props.onToggleSelectAllPending}
          />
        </div>
      </header>

      <ul className="m-0 list-none divide-y divide-gray-200 border-t border-tertiary p-0 md:hidden">
        {isEmpty ? (
          <li className="px-6 py-4 text-sm text-dark-brown">Nenhum membro encontrado.</li>
        ) : (
          props.rows.map((member) => (
            <FeeMemberListItem
              key={member.userId}
              member={member}
              isSelected={props.selectedIds.includes(member.userId)}
              onToggle={props.onToggleMember}
              onConfirm={props.onConfirmMember}
            />
          ))
        )}
      </ul>

      <div className="hidden md:block">
        <Table bordered={false}>
          <Table.Header>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Row key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.HeaderCell
                    key={header.id}
                    className={header.column.columnDef.meta?.className}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Table.HeaderCell>
                ))}
              </Table.Row>
            ))}
          </Table.Header>
          <Table.Body>
            {isEmpty ? (
              <Table.Row>
                <Table.Cell colSpan={columns.length}>Nenhum membro encontrado.</Table.Cell>
              </Table.Row>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Row key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Cell key={cell.id} className={cell.column.columnDef.meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-tertiary bg-table-highlight px-6 py-4">
        <span className="font-semibold text-dark-brown">Total Geral</span>
        <div className="flex items-center gap-4">
          <StatBlock value={counts.paid} label="pagos" />
          <span aria-hidden="true" className="text-secondary-foreground">
            ·
          </span>
          <StatBlock value={counts.pending} label="pendentes" />
          {/* Same thresholds as the team-level card, from the one shared helper. */}
          <Badge variant={getFeeTone(counts.paidPercentage, counts.total)}>
            {counts.paidPercentage}%
          </Badge>
        </div>
      </div>
    </section>
  )
}
