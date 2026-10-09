import { FiCheck, FiX } from 'react-icons/fi'
import { ButtonIcon } from '../ButtonIcon/ButtonIcon'
import type { MemberRequestQueueRow } from '../../services/member-requests/member-requests.types'

export type MemberRequestRowActionsProps = {
  row: MemberRequestQueueRow
  onApprove: (row: MemberRequestQueueRow) => void
  onDeny: (row: MemberRequestQueueRow) => void
}

/**
 * Deny and approve, for one request.
 *
 * Only `pending` requests get buttons. An answered request is a record, not a
 * decision — and re-approving one would hit the compare-and-set in
 * `resolveRequests` and silently do nothing, which looks like a broken button
 * rather than a no-op.
 *
 * Deny is outlined and approve is filled green, so the affirmative action is
 * the one the eye lands on. The viewer's write permission is checked a level
 * up, in the column factory, which drops the whole `AÇÃO` column rather than
 * rendering a header over disabled buttons (plan H.7).
 */
export function MemberRequestRowActions(props: MemberRequestRowActionsProps) {
  if (props.row.status !== 'pending') {
    return null
  }

  const memberName = props.row.user.nickname || props.row.user.name

  return (
    <div className="flex items-center justify-end gap-2">
      <ButtonIcon
        variant="secondary"
        icon={<FiX size={16} />}
        ariaLabel={`Negar solicitação de ${memberName}`}
        onClick={() => props.onDeny(props.row)}
      />
      <ButtonIcon
        variant="success"
        icon={<FiCheck size={16} />}
        ariaLabel={`Aprovar solicitação de ${memberName}`}
        onClick={() => props.onApprove(props.row)}
      />
    </div>
  )
}
