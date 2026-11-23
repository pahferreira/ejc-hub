import clsx from 'clsx'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { teamColorHex } from '../ScheduleActivityCard/teamColorHex'

export type ScheduleActivityChipsProps = {
  activity: Pick<ScheduleActivity, 'adminsResponsible' | 'allTeams' | 'guestName' | 'teams'>
  /** The viewer's team in the current event, or null. Its chip is filled. */
  myTeamInstanceId: string | null
  /** Leaves the guest out, for a card that names it beside the place instead. */
  withoutGuest?: boolean
}

function Chip(props: {
  children: React.ReactNode
  colorHex: string
  isMyTeam?: boolean
  plain?: boolean
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border  px-2.5 py-0.5 text-xs font-medium',
        props.isMyTeam
          ? 'bg-primary border-dark-brown text-white'
          : 'bg-tertiary-background border-tertiary text-dark-brown'
      )}
    >
      {!props.plain && (
        <span
          aria-hidden
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: props.isMyTeam ? 'white' : props.colorHex }}
        />
      )}
      {props.children}
    </span>
  )
}

/**
 * Who is responsible for an activity, as chips: "Coord. Geral", "Todas as
 * equipes", the guest, then each team in its circle's color. The viewer's
 * team's chip is filled.
 */
export function ScheduleActivityChips(props: ScheduleActivityChipsProps) {
  const { activity } = props

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {activity.adminsResponsible && (
        <Chip colorHex={teamColorHex('coord-geral')}>Coord. Geral</Chip>
      )}
      {activity.allTeams && (
        <Chip isMyTeam colorHex="all-teams">
          Todas as equipes
        </Chip>
      )}
      {activity.guestName && !props.withoutGuest && (
        <Chip plain colorHex={teamColorHex('coord-geral')}>
          Convidado: {activity.guestName}
        </Chip>
      )}
      {activity.teams.map((team) => (
        <span key={team.teamInstanceId} className="inline-flex items-center gap-1.5">
          <Chip
            isMyTeam={team.teamInstanceId === props.myTeamInstanceId}
            colorHex={teamColorHex(team.colorToken)}
          >
            {team.teamName}
          </Chip>
        </span>
      ))}
    </div>
  )
}
