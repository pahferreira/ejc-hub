import { FiAlertCircle } from 'react-icons/fi'
import { Button } from '../Button/Button'
import { Modal } from '../Modal/Modal'
import { TeamAvatar } from '../TeamAvatar/TeamAvatar'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { approveButtonLabel } from './approveRequestSummary'
import { pluralize } from '../../utils/pluralize/pluralize'
import type { MemberRequestQueueRow } from '../../services/member-requests/member-requests.types'

export type ApproveRequestModalProps = {
  open: boolean
  /**
   * The request being approved, or `null` while the dialog closes. Held by id
   * on the page and looked up in the live rows — see `DenyRequestModal`.
   */
  request: MemberRequestQueueRow | null
  onClose: () => void
  onSubmit: () => void
  isSaving?: boolean
}

/**
 * "Aprovar solicitação": places the person on the team, and closes every rival
 * request for them in the same transaction.
 *
 * **The warning copy says *encerrar* and *sem efeito*, never *negar***. The
 * losing requests are stored as `outdated`, which the coordinator's own page
 * reports as "Sem efeito"; the signed-off screens say "serão negadas
 * automaticamente", and that wording would give one event two vocabularies
 * (plan D8). This is a deliberate departure from the mock — restoring it
 * reintroduces the bug the decision exists to prevent.
 *
 * No reason field: an approval needs no justification, and the API leaves
 * `resolutionReason` optional.
 */
export function ApproveRequestModal(props: ApproveRequestModalProps) {
  const supersededCount = props.request?.otherPendingRequests.length ?? 0

  return (
    <Modal open={props.open} onClose={props.onClose} title="Aprovar Solicitação" size="lg">
      {props.request && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <UserAvatar name={props.request.user.name} pictureUrl={props.request.user.pictureUrl} />
            <div className="flex min-w-0 flex-col">
              <span className="font-semibold text-dark-brown">{props.request.user.nickname}</span>
              <span className="text-xs text-secondary-foreground">{props.request.user.name}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3">
            <span className="text-xs font-semibold tracking-wide text-green-700 uppercase">
              Será Designado Para
            </span>
            <div className="flex items-center gap-2">
              <TeamAvatar name={props.request.team.name} size="sm" />
              <span className="text-sm font-medium text-dark-brown">{props.request.team.name}</span>
            </div>
            <span className="text-xs text-secondary-foreground">
              Solicitado por {props.request.requestedBy.name} · {props.request.team.freeSlots}{' '}
              {pluralize(props.request.team.freeSlots, 'vaga restante', 'vagas restantes')}
            </span>
          </div>

          {supersededCount > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <FiAlertCircle aria-hidden="true" className="shrink-0 text-amber-600" size={16} />
                <span className="text-sm font-semibold text-dark-brown">
                  {supersededCount === 1
                    ? 'Há outra solicitação para este membro'
                    : 'Há outras solicitações para este membro'}
                </span>
              </div>
              <p className="m-0 text-xs text-secondary-foreground">
                Ao aprovar esta, as demais serão encerradas automaticamente:
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {props.request.otherPendingRequests.map((sibling) => (
                  <li key={sibling.id} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <TeamAvatar name={sibling.team.name} size="sm" />
                      <span className="truncate text-xs text-dark-brown">
                        {sibling.team.name} · {sibling.requestedBy.name}
                      </span>
                    </span>
                    {/* "sem efeito" — the same words the losing coordinator
                        reads on their own page. Never "será negada". */}
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium whitespace-nowrap text-secondary-foreground">
                      sem efeito
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={props.onClose} disabled={props.isSaving}>
              Cancelar
            </Button>
            <Button onClick={props.onSubmit} disabled={props.isSaving}>
              {props.isSaving ? 'Aprovando...' : approveButtonLabel(supersededCount)}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
