import { createColumnHelper, type RowData } from '@tanstack/react-table'
import { Badge } from '../Badge/Badge'
import { Meter } from '../Meter/Meter'
import { getFeeTone } from './feeTone'
import type { TeamFeeRow } from '../../services/finance/finance.types'

declare module '@tanstack/react-table' {
  // The type parameters are fixed by the interface being augmented; this
  // declaration adds a field that does not reference them.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Extra classes applied to both the header and body cells of this column. */
    className?: string
  }
}

const columnHelper = createColumnHelper<TeamFeeRow>()

export const feeByTeamColumns = [
  columnHelper.accessor('teamName', {
    header: 'Equipe',
    cell: (info) => (
      <span className="inline-flex items-center gap-2">
        <span className="font-medium">{info.getValue()}</span>
      </span>
    ),
  }),
  columnHelper.accessor('total', {
    header: 'Total',
    cell: (info) => <Badge variant="info">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor('paid', {
    header: 'Pagos',
    cell: (info) => <Badge variant="success">{info.getValue()}</Badge>,
  }),
  // Between Pagos and Pendentes, so the three buckets read left to right in the
  // order they partition the team and visibly add up to Total.
  columnHelper.accessor('exempt', {
    header: 'Isentos',
    cell: (info) => <Badge variant="info">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor('pending', {
    header: 'Pendentes',
    cell: (info) => <Badge variant="error">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor('paidPercentage', {
    header: '% Pago',
    cell: (info) => (
      <Badge variant={getFeeTone(info.getValue(), info.row.original.total)}>
        {info.getValue()}%
      </Badge>
    ),
  }),
  columnHelper.display({
    id: 'progress',
    header: 'Progresso',
    enableSorting: false,
    // The bar is the widest column and the least information-dense, so it is
    // the first thing dropped when space is tight. Below 1440px the `% Pago`
    // badge already carries the same number.
    meta: { className: 'hidden min-[1440px]:table-cell' },
    cell: (info) => (
      <div className="w-32 sm:w-40">
        <Meter
          percentage={info.row.original.paidPercentage}
          tone={getFeeTone(info.row.original.paidPercentage, info.row.original.total)}
          label={`${info.row.original.teamName}: ${info.row.original.paidPercentage}% pago`}
        />
      </div>
    ),
  }),
]
