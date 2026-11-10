import { Button } from '../Button/Button'
import { Input } from '../Input/Input'
import { Checkbox } from '../Checkbox/Checkbox'
import { MultiSelector, type Option } from '../MultiSelector/MultiSelector'
import {
  endTimeLabel,
  type ScheduleActivityFormValues,
} from '../../utils/scheduleActivity/scheduleActivity'

/** The per-field validation the form shows inline before it submits. */
export type ScheduleActivityFieldErrors = {
  title?: string
  startTime?: string
  durationMinutes?: string
  place?: string
  /** Nobody responsible: no team, no guest and not the admins. */
  responsible?: string
}

export type ScheduleActivityFormProps = {
  values: ScheduleActivityFormValues
  onChange: (patch: Partial<ScheduleActivityFormValues>) => void
  /** Current-event teams, one option each (value = team instance id). */
  teamOptions: Option[]
  fieldErrors?: ScheduleActivityFieldErrors
  /** An API validation error (overlap, nobody responsible…). */
  error?: string
  onSubmit: () => void
  onCancel: () => void
  isSubmitting?: boolean
  /** `edit` titles the card "EDITAR ATIVIDADE" and saves changes instead of adding. */
  mode?: 'create' | 'edit'
  /** Asks to delete the activity being edited; shows "Excluir" when given. */
  onDelete?: () => void
}

/**
 * The inline "NOVA ATIVIDADE" card, or "EDITAR ATIVIDADE" in place of the card
 * it edits. Not a drawer: it sits in the day's list where the activity lands. A live "Termina às" tracks the start and
 * duration; the responsible box groups teams, a guest and the admins toggle.
 */
export function ScheduleActivityForm(props: ScheduleActivityFormProps) {
  const { values, onChange } = props
  const isEdit = props.mode === 'edit'
  const endLabel = endTimeLabel(values.startTime, values.durationMinutes)

  const selectedTeams = props.teamOptions.filter((option) =>
    values.teamInstanceIds.includes(option.value)
  )

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-primary bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-primary">
          {isEdit ? 'Editar atividade' : 'Nova atividade'}
        </h3>
        {endLabel && (
          <span className="text-sm font-medium text-gray-500">Termina às {endLabel}</span>
        )}
      </div>

      <Input
        label="Título"
        name="title"
        isRequired
        value={values.title}
        onChange={(title) => onChange({ title })}
        error={props.fieldErrors?.title}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Início"
          name="startTime"
          type="time"
          isRequired
          value={values.startTime}
          onChange={(startTime) => onChange({ startTime })}
          error={props.fieldErrors?.startTime}
        />
        <Input
          label="Duração (min)"
          name="durationMinutes"
          type="number"
          isRequired
          min="1"
          value={String(values.durationMinutes)}
          onChange={(value) => onChange({ durationMinutes: Number(value) })}
          error={props.fieldErrors?.durationMinutes}
        />
        <Input
          label="Local"
          name="place"
          isRequired
          value={values.place}
          onChange={(place) => onChange({ place })}
          error={props.fieldErrors?.place}
        />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-tertiary p-3">
        <legend className="px-1 text-xs font-semibold text-gray-500">
          Responsáveis · uma ou mais opções
        </legend>
        <div className="flex items-center gap-2">
          <MultiSelector
            label="Equipes"
            options={props.teamOptions}
            selected={selectedTeams}
            onChange={(selected) =>
              onChange({ teamInstanceIds: selected.map((option) => option.value) })
            }
            placeholder="Buscar equipes..."
          />

          <Input
            label="Convidado"
            name="guestName"
            value={values.guestName}
            onChange={(guestName) => onChange({ guestName })}
          />
        </div>

        <Checkbox
          label="Administração conduz esta atividade"
          checked={values.adminsResponsible}
          onChange={(adminsResponsible) => onChange({ adminsResponsible })}
        />

        {props.fieldErrors?.responsible && (
          <p className="m-0 text-sm text-destructive">{props.fieldErrors.responsible}</p>
        )}
      </fieldset>

      {props.error && <p className="m-0 text-sm text-destructive">{props.error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {props.onDelete && (
          <Button variant="destructive" onClick={props.onDelete} disabled={props.isSubmitting}>
            Excluir
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="text" onClick={props.onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={props.onSubmit} disabled={props.isSubmitting}>
            {isEdit ? 'Salvar alterações' : 'Adicionar atividade'}
          </Button>
        </div>
      </div>
    </div>
  )
}
