import clsx from 'clsx'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import {
  activityEndTime,
  activityStartTime,
  formatDuration,
} from '../../utils/scheduleActivity/scheduleActivity'
import { isMyTeamActivity } from '../../utils/scheduleTimeline/scheduleTimeline'
import { teamColorHex } from '../ScheduleActivityCard/teamColorHex'

export type ScheduleTimelineRowProps = {
  activity: ScheduleActivity
  /**
   * The viewer's team in the current event, or null. When it is responsible,
   * the row gets the accent border and its chip the "Sua equipe" label.
   */
  myTeamInstanceId: string | null
}

function Chip(props: { children: React.ReactNode; colorHex: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-tertiary bg-tertiary-background px-2.5 py-0.5 text-xs font-medium text-dark-brown">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: props.colorHex }}
      />
      {props.children}
    </span>
  )
}

/**
 * One activity on the Cronograma's "Linha do tempo": its start and duration
 * left of a vertical timeline, then the responsible chips, the title, and
 * "place · Convidado: name". The viewer's team's rows get an accent left
 * border and a "Sua equipe" label beside their team's chip.
 */
export function ScheduleTimelineRow(props: ScheduleTimelineRowProps) {
  const { activity } = props
  const isMyTeam = isMyTeamActivity(activity, props.myTeamInstanceId)
  const details = [
    activity.place,
    activity.guestName ? `Convidado: ${activity.guestName}` : null,
  ].filter(Boolean)

  return (
    <li className="flex gap-4">
      <div className="flex w-16 shrink-0 flex-col items-end pt-3 text-right">
        <span className="text-base font-bold leading-tight text-dark-brown">
          {activityStartTime(activity)}
        </span>
        <span className="text-xs font-semibold text-primary">
          {formatDuration(activity.durationMinutes)}
        </span>
      </div>

      <div aria-hidden className="relative flex w-3 shrink-0 justify-center">
        <span className="absolute inset-y-0 w-px bg-tertiary" />
        <span className="relative mt-4 h-3 w-3 rounded-full border-2 border-primary bg-white" />
      </div>

      <article
        aria-label={activity.title}
        className={clsx(
          'mb-3 flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-tertiary bg-white p-4 shadow-sm',
          isMyTeam && 'border-l-4 border-l-primary'
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {activity.teams.map((team) => (
            <span key={team.teamInstanceId} className="inline-flex items-center gap-1.5">
              <Chip colorHex={teamColorHex(team.colorToken)}>{team.teamName}</Chip>
              {team.teamInstanceId === props.myTeamInstanceId && (
                <span className="text-xs font-bold text-primary">Sua equipe</span>
              )}
            </span>
          ))}
          {activity.adminsResponsible && (
            <Chip colorHex={teamColorHex('coord-geral')}>Administração</Chip>
          )}
        </div>

        <p className="m-0 text-base font-semibold text-dark-brown">{activity.title}</p>

        <p className="m-0 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
          <span>{details.join(' · ')}</span>
          <span className="text-xs text-gray-500">até {activityEndTime(activity)}</span>
        </p>
      </article>
    </li>
  )
}
