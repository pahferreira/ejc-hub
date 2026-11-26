import clsx from 'clsx'
import { toEventTime } from '../../../../common/schedule/toEventTime'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import {
  activityEndTime,
  activityStartTime,
  formatDuration,
} from '../../utils/scheduleActivity/scheduleActivity'
import type { ActivityControls } from '../../utils/scheduleLive/scheduleLive'
import { isMyTeamActivity } from '../../utils/scheduleTimeline/scheduleTimeline'
import { Button } from '../Button/Button'
import { ScheduleActivityChips } from '../ScheduleActivityChips/ScheduleActivityChips'
import { ScheduleActivityNotes } from '../ScheduleActivityNotes/ScheduleActivityNotes'

export type ScheduleTimelineRowProps = {
  activity: ScheduleActivity
  /**
   * The viewer's team in the current event, or null. When it is responsible,
   * the row gets the accent border and its chip the "Sua equipe" label.
   */
  myTeamInstanceId: string | null
  /**
   * The Running Schedule (`ScheduleLive`): the status chips, done rows muted
   * with their actual times, and the running row's filled dot. Without it the
   * row is the Phase 1 plan.
   */
  live?: boolean
  /** The clock controls to show, from `activityControls`. None when left out. */
  controls?: ActivityControls
  onStart?: () => void
  onFinish?: () => void
  /** A control request is in flight: the buttons are disabled. */
  isControlPending?: boolean
  /**
   * Opens the note form. The "✎ Nota" button shows only when given (admins and
   * coordinators, live), and turns yellow once the activity has notes.
   */
  onAddNote?: () => void
}

function NoteButton(props: { hasNotes: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={clsx(
        'flex min-w-fit items-center justify-center gap-1 rounded-lg border-2 px-1.5 py-0.5 text-xs font-semibold hover:cursor-pointer',
        props.hasNotes
          ? 'border-amber-400 bg-amber-100 text-amber-900'
          : 'border-tertiary bg-white text-dark-brown'
      )}
    >
      ✎ Nota
    </button>
  )
}

function StatusChip(props: { children: React.ReactNode; tone: 'running' | 'done' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide',
        props.tone === 'running' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
      )}
    >
      {props.children}
    </span>
  )
}

/** The `HH:mm` of an ISO instant on the São Paulo clock. */
function eventTime(instant: string): string {
  return toEventTime(new Date(instant))
}

/**
 * One activity on the Cronograma's "Linha do tempo": its start and duration
 * left of a vertical timeline, then the responsible chips, the title, and
 * "place · Convidado: name". The viewer's team's rows get an accent left
 * border and a "Sua equipe" label beside their team's chip.
 *
 * Live, a done row is muted under a "CONCLUÍDO" chip and shows its actual
 * times; the running row gets "● ACONTECENDO AGORA" and a filled dot. The
 * controls given show as "▶ Iniciar" and "✓ Concluir". The Observações the
 * viewer may read stack under the row, beside the "✎ Nota" button.
 */
export function ScheduleTimelineRow(props: ScheduleTimelineRowProps) {
  const { activity } = props
  const isMyTeam = isMyTeamActivity(activity, props.myTeamInstanceId)
  const isDone = props.live && activity.status === 'done'
  const isRunning = props.live && activity.status === 'running'
  const notes = props.live ? activity.notes : []
  const hasControls = props.controls?.start || props.controls?.finish

  const startTime =
    isDone && activity.actualStartedAt
      ? eventTime(activity.actualStartedAt)
      : activityStartTime(activity)
  const endTime =
    isDone && activity.actualEndedAt ? eventTime(activity.actualEndedAt) : activityEndTime(activity)

  return (
    <li className={clsx('flex gap-4', isDone && 'opacity-60')}>
      <div className="flex w-16 shrink-0 flex-col items-end pt-3 text-right">
        <span className="text-base font-bold leading-tight text-dark-brown">{startTime}</span>
        <span className="text-xs font-semibold text-primary">
          {formatDuration(activity.durationMinutes)}
        </span>
      </div>

      <div aria-hidden className="relative flex w-3 shrink-0 justify-center">
        <span className="absolute inset-y-0 w-px bg-tertiary" />
        <span
          data-testid="timeline-dot"
          className={clsx(
            'relative mt-4 h-3 w-3 rounded-full border-2 border-primary',
            isRunning ? 'bg-primary' : 'bg-white'
          )}
        />
      </div>

      <article
        aria-label={activity.title}
        className={clsx(
          'mb-3 flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-tertiary bg-white p-4 shadow-sm',
          isMyTeam && 'border-l-4 border-l-primary',
          isRunning && 'border-2 border-primary'
        )}
      >
        {(isRunning || isDone) && (
          <div>
            {isRunning ? (
              <StatusChip tone="running">● ACONTECENDO AGORA</StatusChip>
            ) : (
              <StatusChip tone="done">CONCLUÍDO</StatusChip>
            )}
          </div>
        )}

        <ScheduleActivityChips activity={activity} myTeamInstanceId={props.myTeamInstanceId} />

        <p className="m-0 text-base font-semibold text-dark-brown">{activity.title}</p>

        <p className="m-0 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
          <span>{activity.place}</span>
          <span className="text-xs text-gray-500">até {endTime}</span>
        </p>

        <ScheduleActivityNotes notes={notes} />

        {(hasControls || props.onAddNote) && (
          <div className="flex justify-end gap-2">
            {props.onAddNote && (
              <NoteButton hasNotes={notes.length > 0} onClick={props.onAddNote} />
            )}
            {props.controls?.start && (
              <Button size="small" onClick={props.onStart} disabled={props.isControlPending}>
                ▶ Iniciar
              </Button>
            )}
            {props.controls?.finish && (
              <Button size="small" onClick={props.onFinish} disabled={props.isControlPending}>
                ✓ Concluir
              </Button>
            )}
          </div>
        )}
      </article>
    </li>
  )
}
