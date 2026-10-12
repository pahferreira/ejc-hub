import { MyTeamRequestCard } from '../MyTeamRequestCard/MyTeamRequestCard'
import type { MyTeamRequestRow } from '../../services/member-requests/member-requests.types'

export type MyTeamRequestsListProps = {
  rows: MyTeamRequestRow[]
  /**
   * What the empty state says. Owned by the caller, matching
   * `MemberRequestsTable` — "there is nobody" and "your filters match
   * nobody" are different facts, and only the page knows which applies.
   */
  emptyMessage?: string
}

const DEFAULT_EMPTY_MESSAGE = 'Nenhuma solicitação feita ainda.'

/**
 * The coordinator's own requests, stacked as cards rather than a table —
 * there is no column layout to preserve here, unlike the admin queue.
 */
export function MyTeamRequestsList(props: MyTeamRequestsListProps) {
  if (props.rows.length === 0) {
    return (
      <div className="rounded-xl border border-tertiary bg-white px-6 py-12 text-center shadow-md">
        <p className="m-0 text-sm text-secondary-foreground">
          {props.emptyMessage ?? DEFAULT_EMPTY_MESSAGE}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {props.rows.map((row) => (
        <MyTeamRequestCard key={row.id} row={row} />
      ))}
    </div>
  )
}
