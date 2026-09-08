import { Badge } from '../Badge/Badge'
import { Meter } from '../Meter/Meter'
import { getFeeTone } from './feeTone'
import type { TeamFeeRow } from '../../services/finance/finance.types'

export type FeeTeamListItemProps = {
  row: TeamFeeRow
}

/**
 * The narrow-viewport stand-in for a table row. Six columns do not survive a
 * phone, so the same numbers are stacked: name and percentage on top, the bar
 * full width, and the three counts as a labelled row underneath.
 */
export function FeeTeamListItem(props: FeeTeamListItemProps) {
  const tone = getFeeTone(props.row.paidPercentage, props.row.total)

  return (
    <li className="flex flex-col gap-3 px-6 py-4">
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium text-dark-brown">{props.row.teamName}</span>
        <Badge variant={tone}>{props.row.paidPercentage}%</Badge>
      </div>

      <Meter
        percentage={props.row.paidPercentage}
        tone={tone}
        label={`${props.row.teamName}: ${props.row.paidPercentage}% pago`}
      />

      <dl className="m-0 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <dt>Total</dt>
          <dd className="m-0">
            <Badge variant="info">{props.row.total}</Badge>
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt>Pagos</dt>
          <dd className="m-0">
            <Badge variant="success">{props.row.paid}</Badge>
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt>Pendentes</dt>
          <dd className="m-0">
            <Badge variant="error">{props.row.pending}</Badge>
          </dd>
        </div>
      </dl>
    </li>
  )
}
