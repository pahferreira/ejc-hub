import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { Meter } from '../Meter/Meter'
import { Selector, type Option } from '../Selector/Selector'
import { Table } from '../Table'
import { FeeTeamListItem } from './FeeTeamListItem'
import { feeByTeamColumns } from './feeByTeamColumns'
import type { TeamFeeRow } from '../../services/finance/finance.types'

export type FeeByTeamCardProps = {
  rows: TeamFeeRow[]
  /** Aggregate for the whole event, shown beside the header bar. 0–100. */
  overallPaidPercentage: number
}

const COLUMN_COUNT = feeByTeamColumns.length

const DEFAULT_SORT: SortingState = [{ id: 'teamName', desc: false }]

/**
 * The sorts worth offering on a phone, where there are no column headers to
 * click. Values encode the same `{ id, desc }` the table uses, so both layouts
 * read from one sorting state.
 */
const SORT_OPTIONS: Option[] = [
  { label: 'Equipe (A–Z)', value: 'teamName:asc' },
  { label: 'Mais pendentes', value: 'pending:desc' },
  { label: 'Menor % pago', value: 'paidPercentage:asc' },
  { label: 'Maior % pago', value: 'paidPercentage:desc' },
]

function toSortingState(value: string): SortingState {
  const [id, direction] = value.split(':')

  return [{ id, desc: direction === 'desc' }]
}

function toSortValue(sorting: SortingState): string {
  const [first] = sorting

  if (!first) {
    return 'teamName:asc'
  }

  return `${first.id}:${first.desc ? 'desc' : 'asc'}`
}

export function FeeByTeamCard(props: FeeByTeamCardProps) {
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORT)

  const table = useReactTable({
    data: props.rows,
    columns: feeByTeamColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const sortedRows = table.getRowModel().rows
  const isEmpty = sortedRows.length === 0
  // Undefined when the active sort came from a column header with no matching
  // option; the selector then shows its placeholder rather than lying.
  const selectedSort = SORT_OPTIONS.find((option) => option.value === toSortValue(sorting))

  return (
    <section className="w-full overflow-hidden rounded-xl border border-tertiary bg-white shadow-md">
      <header className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
        <div className="flex flex-col">
          <h2 className="m-0 font-serif text-xl text-dark-brown">Visão por Equipe</h2>
          <p className="mt-1 text-sm text-gray-600">
            {props.rows.length} equipes
            <span className="hidden md:inline"> · clique no cabeçalho para ordenar</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-600">Pagamento geral</span>
            <span className="font-serif text-2xl text-dark-brown">
              {props.overallPaidPercentage}%
            </span>
          </div>
          <div className="w-32 sm:w-40">
            <Meter
              percentage={props.overallPaidPercentage}
              tone="success"
              label="Pagamento geral do evento"
            />
          </div>
        </div>
      </header>

      {/* Phones get a sort control because there are no column headers to click. */}
      {!isEmpty && (
        <div className="border-t border-tertiary px-6 py-3 md:hidden">
          <Selector
            label="Ordenar por"
            options={SORT_OPTIONS}
            selected={selectedSort}
            placeholder="Equipe (A–Z)"
            onChange={(option) => setSorting(toSortingState(option.value))}
          />
        </div>
      )}

      <ul className="m-0 list-none divide-y divide-gray-200 border-t border-tertiary p-0 md:hidden">
        {isEmpty ? (
          <li className="px-6 py-4 text-sm text-dark-brown">Nenhuma equipe encontrada.</li>
        ) : (
          sortedRows.map((row) => <FeeTeamListItem key={row.id} row={row.original} />)
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
                    sortDirection={
                      header.column.getCanSort() ? header.column.getIsSorted() : undefined
                    }
                    onSort={header.column.getToggleSortingHandler()}
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
                <Table.Cell colSpan={COLUMN_COUNT}>Nenhuma equipe encontrada.</Table.Cell>
              </Table.Row>
            ) : (
              sortedRows.map((row) => (
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
    </section>
  )
}
