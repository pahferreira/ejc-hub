import { FiClock } from 'react-icons/fi'
import { Button } from '../Button/Button'
import type { RequestMemberRow } from './requestMembersColumns'

export type RequestMemberRowActionProps = {
  row: RequestMemberRow
  onRequest: (row: RequestMemberRow) => void
}

/**
 * The row's action, in the table and in the stacked mobile layout.
 *
 * One branch per `rowStatus`, exhaustively. `assigned` has no row to render
 * yet — `#listEligibleSubscribers` excludes anyone already placed (plan
 * decision D2, provisional) — but it is written and given a story anyway: a
 * non-exhaustive switch here would silently render an empty cell the day the
 * API starts sending it, instead of the label the screens specify.
 */
export function RequestMemberRowAction(props: RequestMemberRowActionProps) {
  const { row } = props

  switch (row.rowStatus) {
    case 'requested':
      return (
        <Button variant="secondary" disabled ariaLabel={`Solicitação enviada para ${row.nickname}`}>
          <span className="inline-flex items-center gap-1.5">
            <FiClock aria-hidden="true" size={14} />
            Solicitado
          </span>
        </Button>
      )
    case 'assigned':
      return (
        <Button variant="secondary" disabled ariaLabel={`${row.nickname} já está em uma equipe`}>
          Já está em uma equipe
        </Button>
      )
    case 'requestable':
      return (
        <Button
          variant="secondary"
          ariaLabel={`Solicitar ${row.nickname}`}
          onClick={() => props.onRequest(row)}
        >
          Solicitar
        </Button>
      )
  }
}
