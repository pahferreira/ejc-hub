import clsx from 'clsx'
import { FaCheck } from 'react-icons/fa'
import { toEventTime } from '../../../../common/schedule/toEventTime'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { activityStartTime } from '../../utils/scheduleActivity/scheduleActivity'
import {
  formatOverrunMinutes,
  formatTimer,
  roundToMinute,
  runningClock,
} from '../../utils/scheduleClock/scheduleClock'
import { Button } from '../Button/Button'
import { ScheduleActivityChips } from '../ScheduleActivityChips/ScheduleActivityChips'
import { ScheduleDriftChip } from '../ScheduleDriftChip/ScheduleDriftChip'

export type ScheduleHappeningNowCardProps = {
  /** The running activity. */
  activity: ScheduleActivity
  /** The server's clock, ticking every second. */
  now: Date
  /** The event's next planned activity after it, or null when it is the last. */
  next: ScheduleActivity | null
  /** The next activity's Previsão. Its planned start when left out. */
  nextForecastStartsAt?: Date
  myTeamInstanceId: string | null
  /** Finishes the activity. Left out for anyone who cannot control the clock. */
  onFinish?: () => void
  /** Undoes the start. Left out for anyone who cannot control the clock. */
  onUndoStart?: () => void
  isControlPending?: boolean
}

/**
 * The Cronograma's top slot while an activity runs: "ACONTECENDO AGORA" with
 * an "● AO VIVO" timer counting down its effective duration, its title, place
 * and who is responsible, "Previsto HH:mm · Iniciado HH:mm", "Decorridos" with
 * a progress bar, the admin's "Marcar como concluída" and "Desfazer início",
 * and "Próxima: {title} às {Previsão}". Past its duration the timer, "Excedeu em" and a "+N min"
 * chip turn red and grow.
 */
export function ScheduleHappeningNowCard(props: ScheduleHappeningNowCardProps) {
  const { activity } = props
  const clock = runningClock(activity, props.now)
  const isOverrun = clock.overrunMs > 0
  const nextStartsAt = props.nextForecastStartsAt
    ? toEventTime(roundToMinute(props.nextForecastStartsAt))
    : props.next && activityStartTime(props.next)

  return (
    <section
      aria-label="Acontecendo agora"
      className="flex flex-col gap-3 rounded-xl border-2 border-dark-brown bg-white p-5 button-shadow"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-wide text-primary">● ACONTECENDO AGORA</span>
        <span
          role="timer"
          aria-label={isOverrun ? 'Tempo excedido' : 'Tempo restante'}
          className={clsx(
            'inline-flex items-center gap-2 text-sm font-bold tabular-nums',
            isOverrun ? 'text-red' : 'text-dark-brown'
          )}
        >
          <span className="text-xs tracking-wide text-red">● AO VIVO</span>
          {isOverrun ? `+${formatTimer(clock.overrunMs)}` : formatTimer(clock.remainingMs)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-2xl font-bold text-dark-brown">{activity.title}</h2>
        <p className="m-0 text-sm text-gray-600">{activity.place}</p>
      </div>

      <ScheduleActivityChips activity={activity} myTeamInstanceId={props.myTeamInstanceId} />

      <p className="m-0 flex flex-wrap items-center gap-2 text-sm font-semibold text-dark-brown">
        <span>
          Previsto {activityStartTime(activity)}
          {activity.actualStartedAt &&
            ` · Iniciado ${toEventTime(new Date(activity.actualStartedAt))}`}
        </span>
        {isOverrun && (
          <ScheduleDriftChip tone="late">{formatOverrunMinutes(clock.overrunMs)}</ScheduleDriftChip>
        )}
      </p>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap justify-between gap-2 text-xs font-semibold tabular-nums">
          <span className="text-gray-600">Decorridos {formatTimer(clock.elapsedMs)}</span>
          {isOverrun && <span className="text-red">Excedeu em {formatTimer(clock.overrunMs)}</span>}
        </div>
        <div
          role="progressbar"
          aria-label="Decorridos"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clock.progress * 100)}
          className="h-2 overflow-hidden rounded-full bg-tertiary-background"
        >
          <div
            className={clsx('h-full rounded-full', isOverrun ? 'bg-red' : 'bg-primary')}
            style={{ width: `${clock.progress * 100}%` }}
          />
        </div>
      </div>

      {(props.onFinish || props.onUndoStart) && (
        <div className="flex flex-wrap gap-2">
          {props.onFinish && (
            <Button onClick={props.onFinish} disabled={props.isControlPending}>
              <FaCheck />
              Marcar como concluída
            </Button>
          )}
          {props.onUndoStart && (
            <Button variant="outline" onClick={props.onUndoStart} disabled={props.isControlPending}>
              Desfazer início
            </Button>
          )}
        </div>
      )}

      {props.next && (
        <p className="m-0 border-t border-tertiary pt-3 text-sm text-gray-600">
          Próxima: <span className="font-semibold text-dark-brown">{props.next.title}</span> às{' '}
          {nextStartsAt}
        </p>
      )}
    </section>
  )
}
