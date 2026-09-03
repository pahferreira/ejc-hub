import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { Meter } from '../Meter/Meter'
import { Table } from '../Table'
import { feeByTeamColumns } from './feeByTeamColumns'
import type { TeamFeeRow } from '../../services/finance/finance.types'

export type FeeByTeamCardProps = {
  rows: TeamFeeRow[]
  /** Aggregate for the whole event, shown beside the header bar. 0–100. */
  overallPaidPercentage: number
}

const COLUMN_COUNT = feeByTeamColumns.length

export function FeeByTeamCard(props: FeeByTeamCardProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'teamName', desc: false }])

  const table = useReactTable({
    data: props.rows,
    columns: feeByTeamColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <section className="w-full overflow-hidden rounded-xl border border-tertiary bg-white shadow-md">
      <header className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
        <div className="flex flex-col">
          <h2 className="m-0 font-serif text-xl text-dark-brown">Visão por Equipe</h2>
          <p className="mt-1 text-sm text-gray-600">
            {props.rows.length} equipes · clique no cabeçalho para ordenar
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

      <Table bordered={false}>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.HeaderCell
                  key={header.id}
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
          {table.getRowModel().rows.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={COLUMN_COUNT}>Nenhuma equipe encontrada.</Table.Cell>
            </Table.Row>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Table.Row key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </section>
  )
}
