import clsx from 'clsx'
import { FiCalendar, FiCheck } from 'react-icons/fi'
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge'
import { TeamAvatar } from '../TeamAvatar/TeamAvatar'
import type { ExperienceType } from '../../services/team-building/team-building.types'

const WEEK_DAYS = [
  { key: 'monday', label: 'S' },
  { key: 'tuesday', label: 'T' },
  { key: 'wednesday', label: 'Q' },
  { key: 'thursday', label: 'Q' },
  { key: 'friday', label: 'S' },
  { key: 'saturday', label: 'S' },
  { key: 'sunday', label: 'D' },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0].charAt(0)
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
}

export type CoordinatorCandidateRowProps = {
  name: string
  nickname: string
  experienceType: ExperienceType
  /** Key of the candidate's circle; colors the newbie badge. */
  circleKey?: string | null
  areas: string[]
  /** Names of the teams this candidate selected as preferences (rendered as avatars). */
  teams: string[]
  /** Whether this candidate has listed this team among their preferences. */
  preferredThisTeam: boolean
  /** Whether the candidate has any prior coordinator experience. */
  hasCoordinatorExperience?: boolean
  /** Names of the teams the candidate has coordinated in past events. */
  coordinatorExperienceTeams?: string[]
  /** Hides the coordinator-experience line entirely (e.g. the add-members flow). */
  hideCoordinatorExperience?: boolean
  /** Days of the week the candidate is available (e.g. ["monday", "friday"]). */
  weekAvailability?: string[]
  selected: boolean
  disabled: boolean
  onToggle: () => void
}

export function CoordinatorCandidateRow(props: CoordinatorCandidateRowProps) {
  const initials = getInitials(props.name)
  const availabilitySet = new Set(props.weekAvailability ?? [])

  const experienceTeams = props.coordinatorExperienceTeams ?? []

  // Prefer the concrete team list; fall back to a generic label when the
  // candidate self-declared experience but we have no recorded teams. Suppressed
  // entirely when the row is used in a flow that doesn't care about coordination.
  const coordinatorExperience = props.hideCoordinatorExperience ? null : experienceTeams.length >
    0 ? (
    <span className="text-xs font-medium text-primary">
      Coordenou: {experienceTeams.join(', ')}
    </span>
  ) : props.hasCoordinatorExperience ? (
    <span className="flex items-center gap-1 text-xs font-medium text-primary">
      <FiCheck aria-hidden="true" className="h-3 w-3 shrink-0" />
      Possui experiência com coordenação
    </span>
  ) : null

  return (
    <button
      type="button"
      onClick={props.disabled ? undefined : props.onToggle}
      aria-pressed={props.selected}
      aria-disabled={props.disabled}
      className={clsx(
        'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:cursor-pointer',
        props.disabled && 'cursor-not-allowed opacity-40',
        props.selected
          ? 'border-primary bg-primary/5'
          : 'border-tertiary bg-white hover:bg-secondary/30'
      )}
    >
      {/* Left group: checkbox + avatar, both centered together */}
      <div className="flex shrink-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={clsx(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
            props.selected ? 'border-primary bg-primary' : 'border-dark-brown/40 bg-white'
          )}
        >
          {props.selected && (
            <svg
              className="h-3 w-3 text-white"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>

        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-brown text-xs font-semibold text-white"
        >
          {initials}
        </span>
      </div>

      {/* Content column: top row + skills */}
      <div className="flex min-w-0 flex-1 flex-col gap-0">
        {/* Top row: text + right column */}
        <div className="flex items-start gap-3">
          {/* Nickname + badge / full name / coordinator experience */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-medium text-dark-brown">{props.nickname}</span>
              <ExperienceBadge experienceType={props.experienceType} circleKey={props.circleKey} />
            </div>
            <span className="truncate text-xs text-dark-brown/70">{props.name}</span>
            {coordinatorExperience}
          </div>

          {/* Right-aligned team preference avatars + week availability */}
          {(props.teams.length > 0 || availabilitySet.size > 0) && (
            <div className="flex shrink-0 flex-col items-end gap-1">
              {props.teams.length > 0 && (
                <div className="flex space-x-1">
                  {props.teams.map((team, index) => (
                    <TeamAvatar key={`${team}-${index}`} name={team} size="sm" />
                  ))}
                </div>
              )}
              {availabilitySet.size > 0 && (
                <div className="flex items-center gap-1" title="Disponibilidade da semana">
                  <FiCalendar size={10} className="shrink-0 text-dark-brown/50" />
                  <div className="flex gap-0.5">
                    {WEEK_DAYS.map((day) => (
                      <span
                        key={day.key}
                        className={`flex size-3.5 items-center justify-center rounded-full text-[9px] font-semibold ${
                          availabilitySet.has(day.key)
                            ? 'bg-dark-brown text-white'
                            : 'bg-secondary text-secondary-foreground opacity-40'
                        }`}
                      >
                        {day.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Skills — separated by a divider, aligned with content (not under checkbox/avatar) */}
        {props.areas.length > 0 && (
          <>
            <hr className="mx-0 my-1 border-t border-tertiary" />
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-semibold tracking-wide text-dark-brown uppercase">
                Habilidades
              </span>
              <span className="text-xs text-dark-brown/60">{props.areas.join(' | ')}</span>
            </div>
          </>
        )}
      </div>
    </button>
  )
}
