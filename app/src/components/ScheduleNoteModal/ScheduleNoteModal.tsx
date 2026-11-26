import clsx from 'clsx'
import { SCHEDULE_NOTE_MAX_LENGTH } from '../../../../common/schedule/schedule.constants'
import { Button } from '../Button/Button'
import { Modal } from '../Modal/Modal'
import { TextArea } from '../TextArea/TextArea'

export type ScheduleNoteModalProps = {
  open: boolean
  onClose: () => void
  /** The activity the note is for, named in the description. */
  activityTitle: string
  body: string
  onBodyChange: (body: string) => void
  error?: string
  onSubmit: () => void
  isSubmitting?: boolean
}

/**
 * "Nova nota": a short Observação on one activity, up to 500 characters, with a
 * counter that turns red past the limit.
 */
export function ScheduleNoteModal(props: ScheduleNoteModalProps) {
  const length = props.body.trim().length
  const isOverLimit = length > SCHEDULE_NOTE_MAX_LENGTH

  // Esc and the backdrop do nothing while saving, so a failed save keeps the text.
  const closeUnlessSaving = () => {
    if (!props.isSubmitting) {
      props.onClose()
    }
  }

  return (
    <Modal open={props.open} onClose={closeUnlessSaving} title="Nova nota">
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-gray-600">
          Para <span className="font-semibold text-dark-brown">{props.activityTitle}</span>. A
          administração sempre lê. A nota da coordenação chega à sua equipe; a da administração, à
          coordenação das equipes da atividade.
        </p>

        <div className="flex flex-col gap-1">
          <TextArea
            label="Nota"
            name="schedule-note-body"
            isRequired
            value={props.body}
            onChange={props.onBodyChange}
            error={props.error}
          />
          <p
            aria-live="polite"
            className={clsx('m-0 text-right text-xs', isOverLimit ? 'text-red' : 'text-gray-500')}
          >
            {length}/{SCHEDULE_NOTE_MAX_LENGTH}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={props.onClose} disabled={props.isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={props.onSubmit} disabled={props.isSubmitting}>
            {props.isSubmitting ? 'Salvando...' : 'Salvar nota'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
