import { Button } from '../Button/Button'
import { Modal } from '../Modal/Modal'

export type DeleteScheduleActivityModalProps = {
  open: boolean
  /** The activity's title, named in the sentence. */
  activityTitle: string
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
}

/** "Excluir atividade": the confirmation before a hard delete, with no undo. */
export function DeleteScheduleActivityModal(props: DeleteScheduleActivityModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Excluir atividade">
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-dark-brown">
          Excluir <strong className="font-semibold">{props.activityTitle}</strong> do cronograma?
        </p>
        <p className="m-0 text-xs text-secondary-foreground">
          <strong>Esta ação não pode ser desfeita.</strong>
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={props.onClose} disabled={props.isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={props.onConfirm} disabled={props.isDeleting}>
            {props.isDeleting ? 'Excluindo...' : 'Excluir atividade'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
