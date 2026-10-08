import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { FiUsers } from 'react-icons/fi'
import { Button } from '../Button/Button'
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge'
import { Modal } from '../Modal/Modal'
import { Pill } from '../Pill/Pill'
import { TextArea } from '../TextArea/TextArea'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { canSubmitRequest } from './requestMemberForm'
import type { RequestMemberRow } from '../RequestMembersTable/requestMembersColumns'
import { MEMBER_REQUEST_MESSAGE_MAX } from '../../../../common/member-requests'

export type RequestMemberModalProps = {
  open: boolean
  /**
   * Who the modal is about, or `null` while it is closing. Held by the caller
   * and looked up in the live table rows, so a refetch that places the person
   * elsewhere while the modal is open is reflected instead of submitting
   * against a stale row — the same pattern `FeeStatusReviewModal` uses.
   */
  member: RequestMemberRow | null
  /** The coordinator's own team's free slots, for the "N vagas restantes" line. */
  freeSlots: number
  onClose: () => void
  onSubmit: (message: string) => void
  /** Disables the whole dialog while the write is in flight. */
  isSaving?: boolean
}

/**
 * "Solicitar Membro": one person, one reason, sent to the admin queue for
 * approval.
 *
 * Deliberately single-member — bulk requesting is out of scope for this slice
 * (plan G.8). `message` is required here even though the API leaves it
 * optional: a reason is what turns "solicitar" into something an admin can act
 * on.
 */
export function RequestMemberModal(props: RequestMemberModalProps) {
  const [message, setMessage] = useState('')

  // Clears the draft whenever a different person opens, or the same person
  // reopens after a previous close — not on every render, which would erase
  // what the coordinator is mid-typing.
  useEffect(() => {
    if (props.open) {
      setMessage('')
    }
  }, [props.member?.userId, props.open])

  const canSubmit = canSubmitRequest({ message, isSaving: props.isSaving })
  const isOverCap = message.length > MEMBER_REQUEST_MESSAGE_MAX

  const handleSubmit = () => {
    if (!canSubmit) {
      return
    }

    props.onSubmit(message.trim())
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Solicitar Membro" size="lg">
      {props.member && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <UserAvatar name={props.member.name} pictureUrl={props.member.pictureUrl} />
            <div className="flex min-w-0 flex-col">
              <div className="flex gap-2 mb-1">
                <span className="font-semibold text-dark-brown">{props.member.nickname}</span>
                <ExperienceBadge
                  experienceType={props.member.experienceType}
                  circleKey={props.member.circleKey}
                />
              </div>
              <span className="text-xs text-secondary-foreground">{props.member.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-tertiary bg-tertiary/20 px-4 py-3">
            <FiUsers aria-hidden="true" className="shrink-0 text-dark-brown" size={18} />
            <span className="text-sm font-medium text-dark-brown">
              {props.freeSlots} {props.freeSlots === 1 ? 'vaga restante' : 'vagas restantes'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {props.member.areas.map((area) => (
              <Pill key={area}>{area}</Pill>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <TextArea
              label="Motivo da Solicitação"
              name="message"
              placeholder="Explique por que este membro é necessário na sua equipe"
              value={message}
              onChange={setMessage}
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
              {message.length}/{MEMBER_REQUEST_MESSAGE_MAX}
            </span>
          </div>

          <p className="m-0 text-xs text-secondary-foreground">
            A solicitação vai para aprovação da administração. O membro só entra na equipe após ser
            aprovado.
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={props.onClose} disabled={props.isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {props.isSaving ? 'Enviando...' : 'Enviar solicitação'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
