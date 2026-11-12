import { FiEdit2, FiMapPin } from 'react-icons/fi'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import {
  activityEndTime,
  activityStartTime,
  formatDuration,
} from '../../utils/scheduleActivity/scheduleActivity'
import { TruncatedPillList } from '../TruncatedPillList/TruncatedPillList'
import { teamColorHex } from './teamColorHex'

export type ScheduleActivityCardProps = {
  activity: ScheduleActivity
  /** Opens the edit form in place of the card. */
  onEdit?: (activityId: string) => void
}

function Chip(props: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-tertiary bg-tertiary-background px-2.5 py-0.5 text-xs font-medium text-dark-brown">
      {props.children}
    </span>
  )
}

/**
 * One activity as a card: the start time in large type with the end under it,
 * the title, the place, the responsible chips, the duration, and a pencil that
 * stands out on hover to open its edit form.
 */
export function ScheduleActivityCard(props: ScheduleActivityCardProps) {
  const { activity } = props
  const hasResponsible =
    activity.allTeams ||
    activity.teams.length > 0 ||
    activity.adminsResponsible ||
    activity.guestName

  return (
    <article className="group relative flex gap-1 md:gap-4 rounded-xl border border-tertiary bg-white p-4 shadow-sm">
      <div className="flex min-w-14 flex-col items-start rounded-lg py-0.5 text-center">
        <span className="text-base font-bold leading-tight text-dark-brown">
          {activityStartTime(activity)}
        </span>
        <span className="text-xs text-gray-500">{activityEndTime(activity)}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="m-0 text-base font-semibold text-dark-brown">{activity.title}</p>

        <p className="m-0 flex items-center gap-1.5 text-sm text-gray-600">
          <FiMapPin aria-hidden className="shrink-0" />
          {activity.place}
        </p>

        {hasResponsible && (
          <div className="flex flex-wrap gap-1.5">
            {/* Neutral, with no color dot, so it isn't read as one specific team. */}
            {activity.allTeams ? (
              <Chip>Todas as equipes</Chip>
            ) : (
              activity.teams.length > 0 && (
                <TruncatedPillList
                  items={activity.teams}
                  itemNoun="equipes"
                  getItemKey={(team) => team.teamInstanceId}
                  renderItem={(team) => (
                    <Chip>
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: teamColorHex(team.colorToken) }}
                      />
                      {team.teamName}
                    </Chip>
                  )}
                />
              )
            )}
            {activity.adminsResponsible && (
              <div className="flex flex-wrap gap-1.5">
                <Chip>
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: teamColorHex('coord-geral') }}
                  />
                  Coord. Geral
                </Chip>
              </div>
            )}
            {activity.guestName && <Chip>Convidado: {activity.guestName}</Chip>}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end justify-between">
        <span className="text-sm font-semibold text-primary">
          {formatDuration(activity.durationMinutes)}
        </span>
        <button
          type="button"
          aria-label={`Editar ${activity.title}`}
          onClick={() => props.onEdit?.(activity.id)}
          className="rounded-md p-1.5 text-gray-400 opacity-60 transition hover:cursor-pointer hover:bg-tertiary-background hover:text-primary group-hover:opacity-100"
        >
          <FiEdit2 aria-hidden />
        </button>
      </div>
    </article>
  )
}
