import clsx from 'clsx'
import { Button } from '../Button/Button'
import { Input } from '../Input/Input'
import { Modal } from '../Modal/Modal'
import { formatScheduleDay } from '../../utils/scheduleDate/scheduleDate'

export type NewScheduleDayModalProps = {
  open: boolean
  onClose: () => void
  /** The event's dates that have no day yet, one chip each. */
  dateOptions: string[]
  /** `YYYY-MM-DD`, or empty when nothing is picked yet. */
  date: string
  onDateChange: (date: string) => void
  /** The event's first and last São Paulo dates, bounding the date input. */
  minDate?: string
  maxDate?: string
  error?: string
  onSubmit: () => void
  isCreating?: boolean
}

/**
 * "Novo dia do cronograma": a quick-pick chip per free event date, or a date
 * typed by hand. Picking a chip fills the date input, so the two never disagree.
 */
export function NewScheduleDayModal(props: NewScheduleDayModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Novo dia do cronograma">
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-gray-600">
          Cada dia tem seu próprio cronograma. Depois de criar, adicione as atividades em sequência.
        </p>

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
          <Button variant="secondary" onClick={props.onClose} disabled={props.isCreating}>
            Cancelar
          </Button>
          <Button onClick={props.onSubmit} disabled={props.isCreating}>
            {props.isCreating ? 'Criando...' : 'Criar dia'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
