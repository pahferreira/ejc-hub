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
  isControlPending?: boolean
}

/**
 * The Cronograma's top slot when nothing runs: a dashed "PRÓXIMA ATIVIDADE"
 * card with the title, its planned start, "place · Convidado: name", the team
 * chips and the admin's "▶ Iniciar agora".
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
