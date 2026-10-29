import { Button } from '../Button/Button'
import { Modal } from '../Modal/Modal'

export type DeleteScheduleDayModalProps = {
  open: boolean
  /** What the sentence calls the day: `Sexta, 03 abr`. */
  dayLabel: string
  activityCount: number
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
}

/**
 * "Excluir dia": the confirmation before a hard delete. The day's activities go
 * with it and there is no undo, so the warning says both.
 */
export function DeleteScheduleDayModal(props: DeleteScheduleDayModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Excluir dia">
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-dark-brown">
          Excluir <strong className="font-semibold">{props.dayLabel}</strong> do cronograma?
        </p>
        <p className="m-0 text-xs text-secondary-foreground">
          {props.activityCount === 1 && (
            <>
              A <strong>atividade</strong> deste dia também será <strong>excluída</strong>.{' '}
            </>
          )}
          {props.activityCount > 1 && (
            <>
              As <strong>{props.activityCount} atividades</strong> deste dia também serão{' '}
              <strong>excluídas</strong>.{' '}
            </>
          )}
          <strong>Esta ação não pode ser desfeita.</strong>
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={props.onClose} disabled={props.isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={props.onConfirm} disabled={props.isDeleting}>
            {props.isDeleting ? 'Excluindo...' : 'Excluir dia'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
