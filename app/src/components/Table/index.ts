import { Table as TableRoot } from './Table'
import { TableHeader } from './TableHeader'
import { TableBody } from './TableBody'
import { TableRow } from './TableRow'
import { TableHeaderCell } from './TableHeaderCell'
import { TableCell } from './TableCell'
import { TableActionCell } from './TableActionCell'

export type { Action } from './TableActionCell'

export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
  ActionCell: TableActionCell,
})
