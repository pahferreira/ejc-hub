import clsx from 'clsx'
import { toEventTime } from '../../../../common/schedule/toEventTime'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { activityEndTime, activityStartTime } from '../../utils/scheduleActivity/scheduleActivity'
import type { ActivityControls } from '../../utils/scheduleLive/scheduleLive'
import { isMyTeamActivity } from '../../utils/scheduleTimeline/scheduleTimeline'
import { Button } from '../Button/Button'
import { ScheduleActivityChips } from '../ScheduleActivityChips/ScheduleActivityChips'
import { ScheduleActivityDuration } from '../ScheduleActivityDuration/ScheduleActivityDuration'

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
   * Opens the live-edit form (trim, actual times). Shows the "✎" when given:
   * only for whoever can control the clock.
   */
  onEdit?: () => void
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
 * controls given show as "▶ Iniciar" and "✓ Concluir". A trimmed activity
 * shows its planned duration struck through beside the trimmed one, and ends
 * ("até HH:mm") at its trimmed length, and the
 * admin's "✎" opens the live-edit form.
 */
export function ScheduleTimelineRow(props: ScheduleTimelineRowProps) {
  const { activity } = props
  const isMyTeam = isMyTeamActivity(activity, props.myTeamInstanceId)
  const isDone = props.live && activity.status === 'done'
  const isRunning = props.live && activity.status === 'running'

  const startTime =
    isDone && activity.actualStartedAt
      ? eventTime(activity.actualStartedAt)
      : activityStartTime(activity)
  // Live, a trimmed activity ends at its trimmed length.
  const endTime =
    isDone && activity.actualEndedAt
      ? eventTime(activity.actualEndedAt)
      : activityEndTime({
          plannedStartsAt: activity.plannedStartsAt,
          durationMinutes: props.live
            ? activity.effectiveDurationMinutes
            : activity.durationMinutes,
        })

  return (
    <li className={clsx('flex gap-4', isDone && 'opacity-60')}>
      <div className="flex w-16 shrink-0 flex-col items-end pt-3 text-right">
        <span className="text-base font-bold leading-tight text-dark-brown">{startTime}</span>
        <ScheduleActivityDuration
          className="text-xs font-semibold text-primary"
          durationMinutes={activity.durationMinutes}
          adjustedDurationMinutes={props.live ? activity.adjustedDurationMinutes : null}
        />
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
        {(isRunning || isDone || props.onEdit) && (
          <div className="flex items-start justify-between gap-2">
            {isRunning && <StatusChip tone="running">● ACONTECENDO AGORA</StatusChip>}
            {isDone && <StatusChip tone="done">CONCLUÍDO</StatusChip>}
            {props.onEdit && (
              <span className="ml-auto">
                <Button
                  variant="text"
                  size="small"
                  ariaLabel={`Ajustar ${activity.title}`}
                  onClick={props.onEdit}
                >
                  ✎
                </Button>
              </span>
            )}
          </div>
        )}

        <ScheduleActivityChips activity={activity} myTeamInstanceId={props.myTeamInstanceId} />

        <p className="m-0 text-base font-semibold text-dark-brown">{activity.title}</p>

        <p className="m-0 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
          <span>{activity.place}</span>
          <span className="text-xs text-gray-500">até {endTime}</span>
        </p>

        {(props.controls?.start || props.controls?.finish) && (
          <div className="flex justify-end">
            {props.controls.start && (
              <Button size="small" onClick={props.onStart} disabled={props.isControlPending}>
                ▶ Iniciar
              </Button>
            )}
            {props.controls.finish && (
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
