import { FiPlus } from 'react-icons/fi'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import type { Option } from '../MultiSelector/MultiSelector'
import { ScheduleActivityCard } from '../ScheduleActivityCard/ScheduleActivityCard'
import { ScheduleActivityForm } from '../ScheduleActivityForm/ScheduleActivityForm'
import type { useScheduleActivityForm } from '../ScheduleActivityForm/useScheduleActivityForm'
import {
  formatDaySummary,
  suggestedNextStart,
  summarizeDay,
} from '../../utils/scheduleActivity/scheduleActivity'

type ActivityForm = ReturnType<typeof useScheduleActivityForm>

export type ScheduleDayActivitiesProps = {
  activities: ScheduleActivity[]
  /** `YYYY-MM-DD` of the day, for the "(dia seguinte)" check. */
  dayDate: string
  /** Current-event teams for the form's Equipes selector. */
  teamOptions: Option[]
  form: ActivityForm
  onEditActivity?: (activityId: string) => void
}

/** The dashed row that opens the inline form at a suggested start. */
function AddActivityRow(props: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/60 bg-tertiary-background/40 px-4 py-3 text-sm font-medium text-primary transition hover:cursor-pointer hover:border-primary hover:bg-tertiary-background"
    >
      <FiPlus aria-hidden />
      {props.label}
    </button>
  )
}

/**
 * A day's activities: a summary line, the cards in start order, and either the
 * inline form or a dashed "add" row. An empty day explains itself and offers a
 * dashed "Adicionar primeira atividade".
 */
export function ScheduleDayActivities(props: ScheduleDayActivitiesProps) {
  const { activities, dayDate, form } = props
  const summary = summarizeDay(activities, dayDate)
  const nextStart = suggestedNextStart(activities)
  const isEmpty = activities.length === 0

  return (
    <div className="mt-4 flex flex-col gap-3">
      {summary && <p className="m-0 text-sm text-gray-600">{formatDaySummary(summary)}</p>}

      {activities.map((activity) => (
        <ScheduleActivityCard key={activity.id} activity={activity} onEdit={props.onEditActivity} />
      ))}

      {isEmpty && !form.isOpen && (
        <p className="m-0 text-sm text-gray-500">Nenhuma atividade neste dia ainda.</p>
      )}

      {form.isOpen ? (
        <ScheduleActivityForm
          values={form.values}
          onChange={form.change}
          teamOptions={props.teamOptions}
          fieldErrors={form.fieldErrors}
          error={form.error}
          onSubmit={form.submit}
          onCancel={form.close}
          isSubmitting={form.isSubmitting}
        />
      ) : (
        <AddActivityRow
          label={isEmpty ? 'Adicionar primeira atividade' : `Adicionar atividade às ${nextStart}`}
          onClick={() => form.open(nextStart)}
        />
      )}
    </div>
  )
}
