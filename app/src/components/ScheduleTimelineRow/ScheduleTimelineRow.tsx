import clsx from 'clsx'
import { toEventTime } from '../../../../common/schedule/toEventTime'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import {
  activityEndTime,
  activityStartTime,
  formatDuration,
} from '../../utils/scheduleActivity/scheduleActivity'
import {
  actualDurationMinutes,
  driftTone,
  formatDriftMinutes,
  roundToMinute,
  startDriftMinutes,
} from '../../utils/scheduleClock/scheduleClock'
import type { ActivityControls, ActivityForecast } from '../../utils/scheduleLive/scheduleLive'
import { isMyTeamActivity } from '../../utils/scheduleTimeline/scheduleTimeline'
import { Button } from '../Button/Button'
import { ScheduleActivityChips } from '../ScheduleActivityChips/ScheduleActivityChips'
import { ScheduleDriftChip } from '../ScheduleDriftChip/ScheduleDriftChip'
import { DRIFT_TONE_DOT_CLASSES } from '../ScheduleDriftChip/driftToneClasses'
import { FaCheck, FaPlay } from 'react-icons/fa'

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
  /**
   * Live, a remaining (running or planned) activity's Previsão: the row shows
   * it with the planned start struck through, a "PREVISTO +7 min" chip and a
   * dot in its tone. Left out for done rows and the Phase 1 plan.
   */
  forecast?: ActivityForecast
  /** The clock controls to show, from `activityControls`. None when left out. */
  controls?: ActivityControls
  onStart?: () => void
  onFinish?: () => void
  onSkip?: () => void
  /** Undoes the activity's last start, finish or skip, whichever its status shows. */
  onUndo?: () => void
  /** A control request is in flight: the buttons are disabled. */
  isControlPending?: boolean
}

function StatusChip(props: { children: React.ReactNode; tone: 'running' | 'done' | 'skipped' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide',
        props.tone === 'running' && 'bg-primary text-white',
        props.tone === 'done' && 'bg-gray-200 text-gray-700',
        props.tone === 'skipped' && 'border border-dashed border-gray-400 text-gray-500'
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

/** The start column and "até" end of a row: planned, actual or forecast. */
function rowTimes(props: ScheduleTimelineRowProps) {
  const { activity, forecast } = props

  if (props.live && activity.status === 'done') {
    return {
      startTime: activity.actualStartedAt
        ? eventTime(activity.actualStartedAt)
        : activityStartTime(activity),
      endTime: activity.actualEndedAt
        ? eventTime(activity.actualEndedAt)
        : activityEndTime(activity),
      durationMinutes: actualDurationMinutes(activity),
    }
  }

  if (forecast) {
    return {
      startTime: toEventTime(roundToMinute(forecast.forecastStartsAt)),
      endTime: toEventTime(roundToMinute(forecast.forecastEndsAt)),
      durationMinutes: activity.effectiveDurationMinutes,
    }
  }

  return {
    startTime: activityStartTime(activity),
    endTime: activityEndTime(activity),
    durationMinutes: props.live ? activity.effectiveDurationMinutes : activity.durationMinutes,
  }
}

/**
 * One activity on the Cronograma's "Linha do tempo": its start and duration
 * left of a vertical timeline, then the responsible chips, the title, and
 * "place · Convidado: name". The viewer's team's rows get an accent left
 * border and a "Sua equipe" label beside their team's chip.
 *
 * Live, a done row is muted and shows its actual
 * times and how long it really took; the running row gets "● ACONTECENDO
 * AGORA" and a filled dot. A remaining row shows its Previsão, with the
 * planned start struck through and a "PREVISTO" chip when they differ, and
 * its dot is colored on time, late or early. A skipped row gets a dashed card
 * and dot, a "PULADA" chip and a struck-through, muted title. The controls
 * given show as "Iniciar", "⏭ Pular", "Concluir", "Desfazer início",
 * "↻ Reabrir" and "↶ Desfazer"; the rest are hidden.
 */
export function ScheduleTimelineRow(props: ScheduleTimelineRowProps) {
  const { activity } = props
  const isMyTeam = isMyTeamActivity(activity, props.myTeamInstanceId)
  const isDone = props.live && activity.status === 'done'
  const isRunning = props.live && activity.status === 'running'
  const isSkipped = props.live && activity.status === 'skipped'
  const controls = props.controls
  const hasControls = controls && Object.values(controls).some(Boolean)

  const { startTime, endTime, durationMinutes } = rowTimes(props)
  const driftMinutes = props.forecast
    ? startDriftMinutes(activity, props.forecast.forecastStartsAt)
    : 0
  const tone = props.forecast ? driftTone(driftMinutes) : null

  return (
    <li className={clsx('flex gap-4', isDone && 'opacity-60')}>
      <div className="flex w-12 lg:w-16 shrink-0 flex-col items-end pt-3 text-right">
        <span className="text-base font-bold leading-tight text-dark-brown">{startTime}</span>
        {driftMinutes !== 0 && (
          <s aria-label="Horário planejado" className="text-xs text-gray-500">
            {activityStartTime(activity)}
          </s>
        )}
        <span className="text-xs font-semibold text-primary">
          {formatDuration(durationMinutes)}
        </span>
      </div>

      <div aria-hidden className="relative flex w-3 shrink-0 justify-center">
        <span className="absolute inset-y-0 w-px bg-tertiary" />
        <span
          data-testid="timeline-dot"
          className={clsx(
            'relative mt-4 h-3 w-3 rounded-full border-2',
            tone
              ? DRIFT_TONE_DOT_CLASSES[tone]
              : isSkipped
                ? 'border-dashed border-gray-400'
                : 'border-primary',
            isRunning ? 'bg-primary' : 'bg-white'
          )}
        />
      </div>

      <article
        aria-label={activity.title}
        className={clsx(
          'mb-3 flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-tertiary bg-white p-4 shadow-sm',
          isMyTeam && 'border-l-4 border-l-primary',
          isRunning && 'border-2 border-primary',
          isSkipped && 'border-dashed text-gray-500'
        )}
      >
        {(isRunning || isSkipped || driftMinutes !== 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {isRunning && <StatusChip tone="running">● ACONTECENDO AGORA</StatusChip>}
            {isSkipped && <StatusChip tone="skipped">PULADA</StatusChip>}
            {tone && driftMinutes !== 0 && (
              <ScheduleDriftChip tone={tone}>
                PREVISTO {formatDriftMinutes(driftMinutes)}
              </ScheduleDriftChip>
            )}
          </div>
        )}

        <ScheduleActivityChips activity={activity} myTeamInstanceId={props.myTeamInstanceId} />

        <p
          className={clsx(
            'm-0 text-base font-semibold',
            isSkipped ? 'text-gray-500 line-through' : 'text-dark-brown'
          )}
        >
          {activity.title}
        </p>

        <p
          className={clsx(
            'm-0 flex flex-wrap items-center justify-between gap-2 text-sm',
            isSkipped ? 'text-gray-500' : 'text-gray-600'
          )}
        >
          <span>{activity.place}</span>
          <span className="text-xs text-gray-500">até {endTime}</span>
        </p>

        {hasControls && (
          <div className="flex flex-wrap justify-end gap-2">
            {controls.undoStart && (
              <Button
                size="small"
                variant="outline"
                onClick={props.onUndo}
                disabled={props.isControlPending}
              >
                Desfazer início
              </Button>
            )}
            {controls.reopen && (
              <Button
                size="small"
                variant="outline"
                onClick={props.onUndo}
                disabled={props.isControlPending}
              >
                ↻ Reabrir
              </Button>
            )}
            {controls.undoSkip && (
              <Button
                size="small"
                variant="outline"
                onClick={props.onUndo}
                disabled={props.isControlPending}
              >
                ↶ Desfazer
              </Button>
            )}
            {controls.skip && (
              <Button
                size="small"
                variant="outline"
                onClick={props.onSkip}
                disabled={props.isControlPending}
              >
                ⏭ Pular
              </Button>
            )}
            {controls.start && (
              <Button size="small" onClick={props.onStart} disabled={props.isControlPending}>
                <FaPlay size={10} />
                Iniciar
              </Button>
            )}
            {controls.finish && (
              <Button size="small" onClick={props.onFinish} disabled={props.isControlPending}>
                <FaCheck size={10} />
                Concluir
              </Button>
            )}
          </div>
        )}
      </article>
    </li>
  )
}
