import { FaCheck } from 'react-icons/fa'
import { toEventTime } from '../../../../common/schedule/toEventTime'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { activityStartTime } from '../../utils/scheduleActivity/scheduleActivity'
import { Button } from '../Button/Button'
import { ScheduleActivityChips } from '../ScheduleActivityChips/ScheduleActivityChips'

export type ScheduleHappeningNowCardProps = {
  /** The running activity. */
  activity: ScheduleActivity
  /** The event's next planned activity after it, or null when it is the last. */
  next: ScheduleActivity | null
  myTeamInstanceId: string | null
  /** Finishes the activity. Left out for anyone who cannot control the clock. */
  onFinish?: () => void
  isControlPending?: boolean
}

/**
 * The Cronograma's top slot while an activity runs: "ACONTECENDO AGORA", its
 * title, place and who is responsible, "Previsto HH:mm · Iniciado HH:mm", the
 * admin's "Marcar como concluída", and "Próxima: {title} às HH:mm".
 */
export function ScheduleHappeningNowCard(props: ScheduleHappeningNowCardProps) {
  const { activity } = props

  return (
    <section
      aria-label="Acontecendo agora"
      className="flex flex-col gap-3 rounded-xl border-2 border-dark-brown bg-white p-5 button-shadow"
    >
      <span className="text-xs font-bold tracking-wide text-primary">● ACONTECENDO AGORA</span>

      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-2xl font-bold text-dark-brown">{activity.title}</h2>
        <p className="m-0 text-sm text-gray-600">{activity.place}</p>
      </div>

      <ScheduleActivityChips activity={activity} myTeamInstanceId={props.myTeamInstanceId} />

      <p className="m-0 text-sm font-semibold text-dark-brown">
        Previsto {activityStartTime(activity)}
        {activity.actualStartedAt &&
          ` · Iniciado ${toEventTime(new Date(activity.actualStartedAt))}`}
      </p>

      {props.onFinish && (
        <div>
          <Button onClick={props.onFinish} disabled={props.isControlPending}>
            <FaCheck />
            Marcar como concluída
          </Button>
        </div>
      )}

      {props.next && (
        <p className="m-0 border-t border-tertiary pt-3 text-sm text-gray-600">
          Próxima: <span className="font-semibold text-dark-brown">{props.next.title}</span> às{' '}
          {activityStartTime(props.next)}
        </p>
      )}
    </section>
  )
}
