import { Fragment } from 'react'
import { FiPlus } from 'react-icons/fi'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import type { Option } from '../MultiSelector/MultiSelector'
import { ScheduleActivityCard } from '../ScheduleActivityCard/ScheduleActivityCard'
import { ScheduleActivityForm } from '../ScheduleActivityForm/ScheduleActivityForm'
import type { useScheduleActivityForm } from '../ScheduleActivityForm/useScheduleActivityForm'
import { DeleteScheduleActivityModal } from '../DeleteScheduleActivityModal/DeleteScheduleActivityModal'
import {
  activityGaps,
  formatDaySummary,
  formatDuration,
  suggestedNextStart,
  summarizeDay,
  type ActivityGap,
} from '../../utils/scheduleActivity/scheduleActivity'

type ActivityForm = ReturnType<typeof useScheduleActivityForm>

export type ScheduleDayActivitiesProps = {
  activities: ScheduleActivity[]
  /** `YYYY-MM-DD` of the day, for the "(dia seguinte)" check. */
  dayDate: string
  /** Current-event teams for the form's Equipes selector. */
  teamOptions: Option[]
  form: ActivityForm
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

/** The slim row between two activities with free time: "Intervalo livre · 13:00–14:00 · 1h". */
function GapRow(props: { gap: ActivityGap; onFill: () => void }) {
  const { gap } = props

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-tertiary px-4 py-1.5 text-xs text-gray-500">
      <span>
        Intervalo livre · {gap.startTime}–{gap.endTime} · {formatDuration(gap.durationMinutes)}
      </span>
      <button
        type="button"
        onClick={props.onFill}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-primary transition hover:cursor-pointer hover:bg-tertiary-background"
      >
        <FiPlus aria-hidden />
        Preencher
      </button>
    </div>
  )
}

/**
 * A day's activities: a summary line, the cards in start order with a gap row
 * wherever there is free time between two, and either the inline form or a
 * dashed "add" row. The form opens in place of the card it edits, under the gap
 * it fills, or at the end for a new activity. An empty day explains itself and
 * offers a dashed "Adicionar primeira atividade".
 */
export function ScheduleDayActivities(props: ScheduleDayActivitiesProps) {
  const { activities, dayDate, form } = props
  const summary = summarizeDay(activities, dayDate)
  const nextStart = suggestedNextStart(activities)
  const gapsByActivity = new Map(activityGaps(activities).map((gap) => [gap.afterActivityId, gap]))
  const isEmpty = activities.length === 0
  const placement = form.placement
  const editedActivity =
    placement?.kind === 'edit'
      ? activities.find((activity) => activity.id === placement.activityId)
      : undefined
  const isOpenAtEnd = placement?.kind === 'end'

  const renderForm = () => (
    <ScheduleActivityForm
      values={form.values}
      onChange={form.change}
      teamOptions={props.teamOptions}
      fieldErrors={form.fieldErrors}
      error={form.error}
      onSubmit={form.submit}
      onCancel={form.close}
      isSubmitting={form.isSubmitting}
      mode={placement?.kind === 'edit' ? 'edit' : 'create'}
      onDelete={placement?.kind === 'edit' ? form.askDelete : undefined}
    />
  )

  return (
    <div className="mt-4 flex flex-col gap-3">
      {summary && <p className="m-0 text-sm text-gray-600">{formatDaySummary(summary)}</p>}

      {activities.map((activity) => {
        const gap = gapsByActivity.get(activity.id)
        const isFillingGap = placement?.kind === 'gap' && placement.afterActivityId === activity.id

        return (
          <Fragment key={activity.id}>
            {activity.id === editedActivity?.id ? (
              renderForm()
            ) : (
              <ScheduleActivityCard activity={activity} onEdit={() => form.edit(activity)} />
            )}
            {isFillingGap && renderForm()}
            {gap && !isFillingGap && (
              <GapRow
                gap={gap}
                onFill={() => form.open(gap.startTime, gap.durationMinutes, activity.id)}
              />
            )}
          </Fragment>
        )
      })}

      {isEmpty && !isOpenAtEnd && (
        <p className="m-0 text-sm text-gray-500">Nenhuma atividade neste dia ainda.</p>
      )}

      {isOpenAtEnd ? (
        renderForm()
      ) : (
        <AddActivityRow
          label={isEmpty ? 'Adicionar primeira atividade' : `Adicionar atividade às ${nextStart}`}
          onClick={() => form.open(nextStart)}
        />
      )}

      {editedActivity && (
        <DeleteScheduleActivityModal
          open={form.isConfirmingDelete}
          activityTitle={editedActivity.title}
          onClose={form.cancelDelete}
          onConfirm={() => void form.confirmDelete()}
          isDeleting={form.isDeleting}
        />
      )}
    </div>
  )
}
