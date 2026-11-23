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
  isControlPending?: boolean
}

/**
 * A dashed card for an activity still to start: "PRÓXIMA ATIVIDADE" in the
 * Cronograma's top slot when nothing runs, or "PRÓXIMA DA SUA EQUIPE" under
 * it. The title, its planned start, "place · Convidado: name", the team
 * chips, "Começa às {Previsão} — em {time}" with its drift chip, and the
 * admin's "▶ Iniciar agora".
 */
export function ScheduleNextActivityCard(props: ScheduleNextActivityCardProps) {
  const { activity } = props
  const label = props.forMyTeam ? 'Próxima da sua equipe' : 'Próxima atividade'
  const driftMinutes = startDriftMinutes(activity, props.forecastStartsAt)

  return (
    <section
      aria-label={label}
      className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-tertiary bg-white p-5"
    >
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

      {props.onStart && (
        <div>
          <Button onClick={props.onStart} disabled={props.isControlPending}>
            ▶ Iniciar agora
          </Button>
        </div>
      )}
    </section>
  )
}
