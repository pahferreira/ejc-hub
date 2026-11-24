import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { activityStartTime } from '../../utils/scheduleActivity/scheduleActivity'
import { Button } from '../Button/Button'
import { ScheduleActivityChips } from '../ScheduleActivityChips/ScheduleActivityChips'

export type ScheduleNextActivityCardProps = {
  /** The day's next planned activity. */
  activity: ScheduleActivity
  myTeamInstanceId: string | null
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
 * The Cronograma's top slot when nothing runs: a dashed "PRÓXIMA ATIVIDADE"
 * card with the title, its planned start, "place · Convidado: name", the team
 * chips, a "↻ Reabrir {title}" link for the last finished activity, and the
 * admin's "▶ Iniciar agora" and "⏭ Pular".
 */
export function ScheduleNextActivityCard(props: ScheduleNextActivityCardProps) {
  const { activity } = props

  return (
    <section
      aria-label="Próxima atividade"
      className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-tertiary bg-white p-5"
    >
      <span className="text-xs font-bold tracking-wide text-primary">
        PRÓXIMA ATIVIDADE · {activityStartTime(activity)}
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

      {(props.onStart || props.onSkip) && (
        <div className="flex flex-wrap gap-2">
          {props.onStart && (
            <Button onClick={props.onStart} disabled={props.isControlPending}>
              ▶ Iniciar agora
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
