import { useMemo } from 'react'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Table } from '../Table'
import { FeeMemberListItem } from '../TeamMembersFeeCard/FeeMemberListItem'
import { MemberFeeReviewAction } from './MemberFeeReviewAction'
import { createEventFeeMembersColumns } from './eventFeeMembersColumns'
import type { EventFeeMemberRow } from '../../services/finance/finance.types'

export type EventFeeMembersTableProps = {
  /** One page of members. Filtering and paging happen on the server. */
  rows: EventFeeMemberRow[]
  /**
   * Currently selected member ids. Owned by the caller because the bulk-action
   * bar is a viewport-fixed sibling rendered outside this card, and both must
   * read the same selection. `feeMemberSelection.ts` holds the update rules.
   */
  selectedIds: string[]
  onToggleMember: (memberId: string) => void
  /** Opens the status review dialog for one member. */
  onReviewMember: (memberId: string) => void
  /**
   * Whether the viewer may settle a fee (`financials-event-fee:update`). False
   * strips the selection column and the row actions, leaving a read-only table.
   */
  canConfirm?: boolean
}

/**
 * Every member assigned to a team in the current event, with their fee standing.
 *
 * The mixed-team counterpart to `TeamMembersFeeCard`: same per-person row, but
 * carrying the team and experience columns that a single-team list has no use
 * for, and no footer totals — the page's stat cards already hold those, computed
 * by the API over the whole filtered set rather than the page on screen.
 *
 * Uses a bare `section` rather than `Card` for the same reason its siblings do:
 * `Card` hardcodes its padding, which a full-bleed table cannot sit inside.
 */
export function EventFeeMembersTable(props: EventFeeMembersTableProps) {
  const isEmpty = props.rows.length === 0
  const canConfirm = props.canConfirm ?? false

  const columns = useMemo(
    () =>
      createEventFeeMembersColumns({
        selectedIds: props.selectedIds,
        onToggleMember: props.onToggleMember,
        onReviewMember: props.onReviewMember,
        canConfirm,
      }),
    [props.selectedIds, props.onToggleMember, props.onReviewMember, canConfirm]
  )

  const table = useReactTable({
    data: props.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="w-full overflow-hidden rounded-xl border border-tertiary bg-white shadow-md">
      <ul className="m-0 list-none divide-y divide-gray-200 p-0 md:hidden">
        {isEmpty ? (
          <li className="px-6 py-4 text-sm text-dark-brown">Nenhum membro encontrado.</li>
        ) : (
          props.rows.map((member) => (
            <FeeMemberListItem
              key={member.userId}
              member={member}
              team={{ key: member.teamKey, name: member.teamName }}
              isSelected={props.selectedIds.includes(member.userId)}
              readOnly={!canConfirm}
              onToggle={props.onToggleMember}
              action={
                canConfirm ? (
                  <MemberFeeReviewAction member={member} onReview={props.onReviewMember} />
                ) : undefined
              }
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
                <Table.Row
                  key={row.id}
                  // Tints the whole row so a selection stays legible while
                  // scrolling past the checkbox column on a wide table.
                  className={
                    props.selectedIds.includes(row.original.userId) ? 'bg-table-highlight' : ''
                  }
                >
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
    </section>
  )
}
