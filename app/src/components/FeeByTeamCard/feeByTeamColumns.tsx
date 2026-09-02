import { createColumnHelper } from '@tanstack/react-table'
import { Badge } from '../Badge/Badge'
import { Meter } from '../Meter/Meter'
import { getFeeTone } from './feeTone'
import { getTeamDotColor } from './teamDotColor'
import type { TeamFeeRow } from '../../services/finance/finance.types'

const columnHelper = createColumnHelper<TeamFeeRow>()

export const feeByTeamColumns = [
  columnHelper.accessor('teamName', {
    header: 'Equipe',
    cell: (info) => (
      <span className="inline-flex items-center gap-2">
        <span
          className={`size-2 shrink-0 rounded-full ${getTeamDotColor(info.row.original.teamKey)}`}
          aria-hidden
        />
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
