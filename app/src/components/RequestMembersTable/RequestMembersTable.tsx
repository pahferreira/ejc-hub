import { useMemo } from 'react'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Table } from '../Table'
import { RequestMembersListItem } from './RequestMembersListItem'
import { createRequestMembersColumns, type RequestMemberRow } from './requestMembersColumns'

export type RequestMembersTableProps = {
  /** One page of candidates. Filtering, sorting and paging happen on the server. */
  rows: RequestMemberRow[]
  /** Opens the request modal for one row. Only offered on `requestable` rows. */
  onRequest: (row: RequestMemberRow) => void
}

/**
 * The "Solicitar Membros" candidate list: desktop table plus a `md:hidden`
 * mobile list, per `EventFeeMembersTable`.
 *
 * Uses a bare `section` rather than `Card` for the same reason its financial
 * counterpart does: `Card` hardcodes its padding, which a full-bleed table
 * cannot sit inside.
 */
export function RequestMembersTable(props: RequestMembersTableProps) {
  const isEmpty = props.rows.length === 0

  const columns = useMemo(
    () => createRequestMembersColumns({ onRequest: props.onRequest }),
    [props.onRequest]
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
          <li className="px-6 py-4 text-sm text-dark-brown">Nenhum inscrito encontrado.</li>
        ) : (
          props.rows.map((row) => (
            <RequestMembersListItem key={row.userId} row={row} onRequest={props.onRequest} />
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
                <Table.Cell colSpan={columns.length}>Nenhum inscrito encontrado.</Table.Cell>
              </Table.Row>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Row
                  key={row.id}
                  // Tints the row this team already asked for, matching the
                  // `Solicitado` action beside it — read at a glance, not just
                  // from the disabled button.
                  className={row.original.rowStatus === 'requested' ? 'bg-table-highlight' : ''}
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
