import { FaPlay } from 'react-icons/fa'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { activityStartTime } from '../../utils/scheduleActivity/scheduleActivity'
import {
  driftTone,
  formatDriftMinutes,
  formatStartsAt,
  startDriftMinutes,
} from '../../utils/scheduleClock/scheduleClock'
import { Button } from '../Button/Button'
import { ScheduleActivityChips } from '../ScheduleActivityChips/ScheduleActivityChips'
import { ScheduleDriftChip } from '../ScheduleDriftChip/ScheduleDriftChip'

export type ScheduleNextActivityCardProps = {
  /** The day's next planned activity, or the viewer's team's next one. */
  activity: ScheduleActivity
  /** Its Previsão: when it is now expected to start. */
  forecastStartsAt: Date
  /** The server's clock, for how far off the start is. */
  now: Date
  myTeamInstanceId: string | null
  /** "Próxima da sua equipe": the viewer's team's next activity, after the Próxima one. */
  forMyTeam?: boolean
  /** Starts the activity. Left out for anyone who cannot control the clock. */
  onStart?: () => void
  /** Skips the activity. Left out for anyone who cannot control the clock. */
  onSkip?: () => void
  /**
   * The most recently finished activity, which may reopen since nothing runs,
   * and how. Left out when there is none, or for anyone who cannot control the clock.
   */
  reopen?: { title: string; onReopen: () => void }
  isControlPending?: boolean
}

/**
 * A dashed card for an activity still to start: "PRÓXIMA ATIVIDADE" in the
 * Cronograma's top slot when nothing runs, or "PRÓXIMA DA SUA EQUIPE" under
 * it. The title, its planned start, "place · Convidado: name", the team
 * chips, "Começa às {Previsão} — em {time}" with its drift chip, a
 * "↻ Reabrir {title}" link for the last finished activity, and the admin's
 * "Iniciar agora" and "⏭ Pular".
 */
export function ScheduleNextActivityCard(props: ScheduleNextActivityCardProps) {
  const { activity } = props
  const label = props.forMyTeam ? 'Próxima da sua equipe' : 'Próxima atividade'
  const driftMinutes = startDriftMinutes(activity, props.forecastStartsAt)

  return (
    <section
      aria-label={label}
      className="flex flex-col gap-3 lg:flex-row rounded-xl border-2 border-dashed border-tertiary bg-white p-5 justify-between"
    >
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-primary">
          {label} · {activityStartTime(activity)}
        </span>

        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-2xl font-bold text-dark-brown">{activity.title}</h2>
          <p className="m-0 text-sm text-gray-600">
            {activity.place}
            {activity.guestName && ` · Convidado: ${activity.guestName}`}
          </p>
        </div>

        <ScheduleActivityChips
          activity={activity}
          myTeamInstanceId={props.myTeamInstanceId}
          withoutGuest
        />

        <p className="m-0 flex flex-wrap items-center gap-2 text-sm font-semibold text-dark-brown">
          {formatStartsAt(props.forecastStartsAt, props.now)}
          {driftMinutes !== 0 && (
            <ScheduleDriftChip tone={driftTone(driftMinutes)}>
              {formatDriftMinutes(driftMinutes)}
            </ScheduleDriftChip>
          )}
        </p>

        {props.reopen && (
          <div>
            <button
              type="button"
              onClick={props.reopen.onReopen}
              disabled={props.isControlPending}
              className="cursor-pointer text-sm font-semibold text-dark-brown underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↻ Reabrir {props.reopen.title}
            </button>
          </div>
        )}
      </div>
      {(props.onStart || props.onSkip) && (
        <div className="flex flex-wrap items-start gap-2">
          {props.onStart && (
            <Button onClick={props.onStart} disabled={props.isControlPending}>
              <FaPlay />
              Iniciar agora
            </Button>
          )}
          {props.onSkip && (
            <Button variant="outline" onClick={props.onSkip} disabled={props.isControlPending}>
              ⏭ Pular
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
