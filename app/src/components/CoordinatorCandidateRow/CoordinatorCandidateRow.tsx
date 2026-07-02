import clsx from 'clsx'
import { Badge } from '../Badge/Badge'
import { TeamAvatar } from '../TeamAvatar/TeamAvatar'
import { experienceLabels } from '../../pages/TeamBuildingPage/experience'
import type { ExperienceType } from '../../services/team-building/team-building.types'

// Maps the experience variant palette to existing Badge variants.
const experienceBadgeVariant: Record<ExperienceType, 'completed' | 'received' | 'pending'> = {
  newbie: 'completed',
  experienced: 'received',
  experienced_outsider: 'pending',
}

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
  areas: string[]
  /** Names of the teams this candidate selected as preferences (rendered as avatars). */
  teams: string[]
  /** Whether this candidate has listed this team among their preferences. */
  preferredThisTeam: boolean
  selected: boolean
  disabled: boolean
  onToggle: () => void
}

export function CoordinatorCandidateRow(props: CoordinatorCandidateRowProps) {
  const experience = experienceLabels[props.experienceType]
  const badgeVariant = experienceBadgeVariant[props.experienceType]
  const initials = getInitials(props.name)

  return (
    <button
      type="button"
      onClick={props.disabled ? undefined : props.onToggle}
      aria-pressed={props.selected}
      aria-disabled={props.disabled}
      className={clsx(
        'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:cursor-pointer',
        props.disabled && 'cursor-not-allowed opacity-40',
        props.selected
          ? 'border-primary bg-primary/5'
          : 'border-tertiary bg-white hover:bg-secondary/30'
      )}
    >
      {/* Checkbox indicator */}
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

      {/* Initials avatar */}
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-brown text-xs font-semibold text-white"
      >
        {initials}
      </span>

      {/* Nickname + experience badge / full name / skills — 3 rows */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium text-dark-brown">{props.nickname}</span>
          <Badge variant={badgeVariant}>{experience.label}</Badge>
        </div>
        <span className="truncate text-xs text-dark-brown/70">{props.name}</span>
        {props.areas.length > 0 && (
          <span className="text-xs text-dark-brown/60">{props.areas.join(' | ')}</span>
        )}
      </div>

      {/* Right-aligned team preference avatars */}
      {props.teams.length > 0 && (
        <div className="ml-auto flex shrink-0 space-x-1">
          {props.teams.map((team, index) => (
            <TeamAvatar key={`${team}-${index}`} name={team} size="sm" />
          ))}
        </div>
      )}
    </button>
  )
}
