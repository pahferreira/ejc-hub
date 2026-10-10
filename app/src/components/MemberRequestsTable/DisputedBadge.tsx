import { FiAlertCircle } from 'react-icons/fi'
import { pluralize } from '../../utils/pluralize/pluralize'

export type DisputedBadgeProps = {
  /** How many *other* teams have a pending request for the same person. */
  otherPendingCount: number
}

/**
 * The `+ N equipe(s)` pill beside a contested member's name.
 *
 * Says only how many other teams are asking, never which — the same privacy
 * rule the coordinator page keeps (Phase F): an admin needs the count to know
 * a decision is contested, and naming the rivals here would leak one team's
 * interest to a screen a coordinator can also hold.
 *
 * Renders nothing when the request is uncontested, so callers can place it
 * unconditionally.
 */
export function DisputedBadge(props: DisputedBadgeProps) {
  if (props.otherPendingCount <= 0) {
    return null
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-red-600">
      <FiAlertCircle aria-hidden="true" size={12} />+ {props.otherPendingCount}{' '}
      {pluralize(props.otherPendingCount, 'equipe', 'equipes')}
    </span>
  )
}
