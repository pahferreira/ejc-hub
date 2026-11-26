import { Button } from '../Button/Button'
import { Input } from '../Input/Input'
import { formatDuration } from '../../utils/scheduleActivity/scheduleActivity'
import type {
  LiveEditFieldErrors,
  LiveEditFields,
  LiveEditFormValues,
} from '../../utils/scheduleLiveEdit/scheduleLiveEdit'

export type ScheduleLiveEditFormProps = {
  /** The activity's title, in the card's heading. */
  title: string
  /** The planned duration, shown beside the trim for reference. */
  durationMinutes: number
  /** Which parts the activity's status shows, from `liveEditFields`. */
  fields: LiveEditFields
  values: LiveEditFormValues
  onChange: (patch: Partial<LiveEditFormValues>) => void
  fieldErrors?: LiveEditFieldErrors
  /** An API error: overlapping times, "O cronograma mudou"… */
  error?: string
  onSubmit: () => void
  onCancel: () => void
  isSubmitting?: boolean
}

/**
 * The inline "AJUSTAR ATIVIDADE" card, in place of the timeline row it edits,
 * styled after Planejar Cronograma's activity form. Its parts follow the
 * status: "Duração ajustada (min)" for a planned or running activity, with the
 * planned duration for reference and as its ceiling, and "Remover ajuste"; the actual start for a
 * running or done one, and the actual end for a done one, as São Paulo `HH:mm`.
 */
export function ScheduleLiveEditForm(props: ScheduleLiveEditFormProps) {
  const { values, onChange, fields } = props

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-primary bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-primary">
          Ajustar atividade
        </h3>
        <p className="m-0 text-base font-semibold text-dark-brown">{props.title}</p>
      </div>

      {fields.trim && (
        <div className="flex flex-col gap-1">
          <Input
            label="Duração ajustada (min)"
            name="adjustedDuration"
            type="number"
            min="1"
            max={String(props.durationMinutes)}
            placeholder={String(props.durationMinutes)}
            value={values.adjustedDuration}
            onChange={(adjustedDuration) => onChange({ adjustedDuration })}
            error={props.fieldErrors?.adjustedDuration}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-gray-600">
              Planejada: {formatDuration(props.durationMinutes)}
            </span>
            {values.adjustedDuration !== '' && (
              <Button
                variant="text"
                size="small"
                onClick={() => onChange({ adjustedDuration: '' })}
              >
                Remover ajuste
              </Button>
            )}
          </div>
        </div>
      )}

      {(fields.start || fields.end) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.start && (
            <Input
              label="Início real"
              name="actualStartTime"
              type="time"
              isRequired
              value={values.startTime}
              onChange={(startTime) => onChange({ startTime })}
              error={props.fieldErrors?.startTime}
            />
          )}
          {fields.end && (
            <Input
              label="Fim real"
              name="actualEndTime"
              type="time"
              isRequired
              value={values.endTime}
              onChange={(endTime) => onChange({ endTime })}
              error={props.fieldErrors?.endTime}
            />
          )}
        </div>
      )}

      {props.error && <p className="m-0 text-sm text-destructive">{props.error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="text" onClick={props.onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={props.onSubmit} disabled={props.isSubmitting}>
          Salvar ajuste
        </Button>
      </div>
    </div>
  )
}
