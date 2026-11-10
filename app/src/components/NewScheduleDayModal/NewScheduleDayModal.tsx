import clsx from 'clsx'
import { Button } from '../Button/Button'
import { Input } from '../Input/Input'
import { Modal } from '../Modal/Modal'
import { formatScheduleDay } from '../../utils/scheduleDate/scheduleDate'

const COPY = {
  create: {
    title: 'Novo dia do cronograma',
    description:
      'Cada dia tem seu próprio cronograma. Depois de criar, adicione as atividades em sequência.',
    submit: 'Criar dia',
    submitting: 'Criando...',
  },
  edit: {
    title: 'Editar dia do cronograma',
    description: 'As atividades do dia vão junto para a nova data, mantendo os mesmos horários.',
    submit: 'Salvar',
    submitting: 'Salvando...',
  },
}

export type NewScheduleDayModalProps = {
  open: boolean
  onClose: () => void
  /** Adding a new day, or moving an existing one to another date. Defaults to `create`. */
  mode?: 'create' | 'edit'
  /** The event's dates no other day has, one chip each. */
  dateOptions: string[]
  /** `YYYY-MM-DD`, or empty when nothing is picked yet. */
  date: string
  onDateChange: (date: string) => void
  /** The event's first and last São Paulo dates, bounding the date input. */
  minDate?: string
  maxDate?: string
  error?: string
  onSubmit: () => void
  isSubmitting?: boolean
}

/**
 * "Novo dia do cronograma": a quick-pick chip per free event date, or a date
 * typed by hand. Picking a chip fills the date input, so the two never disagree.
 *
 * "Editar dia" reuses it pre-filled with the day's date, to move the day.
 */
export function NewScheduleDayModal(props: NewScheduleDayModalProps) {
  const copy = COPY[props.mode ?? 'create']

  return (
    <Modal open={props.open} onClose={props.onClose} title={copy.title}>
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-gray-600">{copy.description}</p>

        {props.dateOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {props.dateOptions.map((option) => {
              const isPicked = option === props.date

              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isPicked}
                  onClick={() => props.onDateChange(option)}
                  className={clsx(
                    'rounded-full border px-3 py-1 text-sm hover:cursor-pointer',
                    isPicked
                      ? 'border-dark-brown bg-primary text-white'
                      : 'border-tertiary bg-white text-dark-brown hover:border-dark-brown/50'
                  )}
                >
                  {formatScheduleDay(option)}
                </button>
              )
            })}
          </div>
        )}

        <Input
          label="Data"
          name="schedule-day-date"
          type="date"
          isRequired
          value={props.date}
          onChange={props.onDateChange}
          min={props.minDate}
          max={props.maxDate}
          error={props.error}
        />

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={props.onClose} disabled={props.isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={props.onSubmit} disabled={props.isSubmitting}>
            {props.isSubmitting ? copy.submitting : copy.submit}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
