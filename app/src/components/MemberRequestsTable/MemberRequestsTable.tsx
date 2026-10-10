import { useMemo } from 'react'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Table } from '../Table'
import { MemberRequestsListItem } from './MemberRequestsListItem'
import { createMemberRequestsColumns } from './memberRequestsColumns'
import type { MemberRequestQueueRow } from '../../services/member-requests/member-requests.types'

export type MemberRequestsTableProps = {
  /** One page of requests. Filtering and paging happen on the server. */
  rows: MemberRequestQueueRow[]
  onApprove: (row: MemberRequestQueueRow) => void
  onDeny: (row: MemberRequestQueueRow) => void
  /**
   * Whether the viewer may approve or deny. False drops the `AÇÃO` column
   * entirely rather than disabling its buttons (plan H.7).
   */
  canResolve: boolean
  /**
   * What the empty state says. Owned by the caller because the queue has seven
   * different empty states — "the pending pile is clear" is good news and
   * "your filters match nothing" is not, and only the page knows which applies
   * (plan H.8).
   */
  emptyMessage?: string
}

const DEFAULT_EMPTY_MESSAGE = 'Nenhuma solicitação encontrada.'

/**
 * The admin request queue: desktop table plus a `md:hidden` mobile list, per
 * `EventFeeMembersTable` and its coordinator counterpart `RequestMembersTable`.
 *
 * A bare `section` rather than `Card`, for the same reason both of those use
 * one: `Card` hardcodes padding a full-bleed table cannot sit inside.
 */
export function MemberRequestsTable(props: MemberRequestsTableProps) {
  const isEmpty = props.rows.length === 0
  const emptyMessage = props.emptyMessage ?? DEFAULT_EMPTY_MESSAGE

  const columns = useMemo(
    () =>
      createMemberRequestsColumns({
        onApprove: props.onApprove,
        onDeny: props.onDeny,
        canResolve: props.canResolve,
      }),
    [props.onApprove, props.onDeny, props.canResolve]
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
          <li className="px-6 py-4 text-sm text-dark-brown">{emptyMessage}</li>
        ) : (
          props.rows.map((row) => (
            <MemberRequestsListItem
              key={row.id}
              row={row}
              onApprove={props.onApprove}
              onDeny={props.onDeny}
              canResolve={props.canResolve}
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
                <Table.Cell colSpan={columns.length}>{emptyMessage}</Table.Cell>
              </Table.Row>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Row
                  key={row.id}
                  // Tints contested requests, so a decision that will close
                  // someone else's ask is visible before the modal says so.
                  className={
                    row.original.otherPendingRequests.length > 0 ? 'bg-table-highlight' : ''
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
