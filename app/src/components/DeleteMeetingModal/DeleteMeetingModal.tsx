import { Button } from '../Button/Button'
import { Modal } from '../Modal/Modal'

export type DeleteMeetingModalProps = {
  open: boolean
  /** What the sentence calls the meeting: its title, or `Reunião` with its date. */
  meetingLabel: string
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
}

/**
 * "Excluir reunião": the confirmation before a hard delete.
 *
 * The warning names the consequence a coordinator might not expect: the
 * meeting leaves every member's rate and the team's Média, not just the list.
 * There is no undo, so the destructive button is the only way forward.
 */
export function DeleteMeetingModal(props: DeleteMeetingModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Excluir reunião">
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-dark-brown">
          Excluir <strong className="font-semibold">{props.meetingLabel}</strong>?
        </p>
        <p className="m-0 text-xs text-secondary-foreground">
          A reunião e as presenças registradas nela serão removidas da taxa de presença de todos os
          membros e da média da equipe. Esta ação não pode ser desfeita.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={props.onClose} disabled={props.isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={props.onConfirm} disabled={props.isDeleting}>
            {props.isDeleting ? 'Excluindo...' : 'Excluir reunião'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
