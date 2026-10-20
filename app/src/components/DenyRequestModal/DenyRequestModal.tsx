import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Button } from '../Button/Button'
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge'
import { Modal } from '../Modal/Modal'
import { RequestReason } from '../RequestReason/RequestReason'
import { TeamAvatar } from '../TeamAvatar/TeamAvatar'
import { TextArea } from '../TextArea/TextArea'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { canSubmitDenial, denyImpactMessage } from './denyRequestForm'
import { MEMBER_REQUEST_MESSAGE_MAX } from '../../../../common/member-requests'
import type { MemberRequestQueueRow } from '../../services/member-requests/member-requests.types'

export type DenyRequestModalProps = {
  open: boolean
  /**
   * The request being denied, or `null` while the dialog closes. Held by id on
   * the page and looked up in the live rows, so a refetch cannot leave a stale
   * dialog submitting against a request someone else already answered — the
   * `FeeStatusReviewModal` pattern.
   */
  request: MemberRequestQueueRow | null
  onClose: () => void
  onSubmit: (resolutionReason: string) => void
  isSaving?: boolean
}

/**
 * "Negar solicitação": an admin's explicit no, with a reason for the
 * coordinator.
 *
 * **Every `negar` here is deliberate and stays.** This is the one place in the
 * feature where the word is literally true — the request is stored as `denied`
 * with this admin's id on it. Do not harmonise this copy to the approve
 * modal's "encerrar" (plan D8); that wording exists for *superseded* requests,
 * which nobody denied.
 *
 * The reason is required by the UI and optional in the contract, matching how
 * the coordinator's `message` is treated.
 */
export function DenyRequestModal(props: DenyRequestModalProps) {
  const [reason, setReason] = useState('')

  // Clears the draft when a different request opens, or the same one reopens
  // after a close — not on every render, which would erase mid-typing.
  useEffect(() => {
    if (props.open) {
      setReason('')
    }
  }, [props.request?.id, props.open])

  const canSubmit = canSubmitDenial({ reason, isSaving: props.isSaving })
  const isOverCap = reason.length > MEMBER_REQUEST_MESSAGE_MAX

  const handleSubmit = () => {
    if (!canSubmit) {
      return
    }

    props.onSubmit(reason.trim())
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Negar Solicitação" size="lg">
      {props.request && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <UserAvatar name={props.request.user.name} pictureUrl={props.request.user.pictureUrl} />
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-dark-brown">{props.request.user.nickname}</span>
                <ExperienceBadge
                  experienceType={props.request.user.experienceType}
                  circleKey={props.request.user.circleKey}
                />
              </div>
              <span className="text-xs text-secondary-foreground">{props.request.user.name}</span>
            </div>
          </div>

          <RequestReason text={props.request.message} />

          <div className="flex flex-col gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3">
            <span className="text-xs font-semibold tracking-wide text-red-600 uppercase">
              Equipe Solicitante
            </span>
            <div className="flex items-center gap-2">
              <TeamAvatar name={props.request.team.name} size="sm" />
              <span className="text-sm font-medium text-dark-brown">{props.request.team.name}</span>
            </div>
            <span className="text-xs text-secondary-foreground">
              Solicitado por {props.request.requestedBy.name}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <TextArea
              label="Motivo da Negativa"
              name="resolutionReason"
              placeholder="Explique ao coordenador por que a solicitação foi negada"
              value={reason}
              onChange={setReason}
              isRequired
            />
            {/* TextArea ships no counter and no `maxLength` — this line is the
                modal's own markup, reading the shared `common/` cap. */}
            <span
              className={clsx(
                'self-end text-xs',
                isOverCap ? 'text-red' : 'text-secondary-foreground'
              )}
            >
              {reason.length}/{MEMBER_REQUEST_MESSAGE_MAX}
            </span>
          </div>

          <p className="m-0 text-xs text-secondary-foreground">
            {denyImpactMessage(props.request.otherPendingRequests.length)}
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={props.onClose} disabled={props.isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {props.isSaving ? 'Negando...' : 'Negar solicitação'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
