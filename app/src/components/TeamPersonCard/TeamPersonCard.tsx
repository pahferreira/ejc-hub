import { PersonCard } from '../PersonCard/PersonCard'
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge'
import type { TeamPerson } from '../../services/teams/teams.types'

export type TeamPersonCardProps = {
  person: TeamPerson
  /** Role label shown next to the name (e.g. "Coordenador"). Omitted for members. */
  role?: string
  /** Shows a top-right delete button when provided. */
  onRemove?: () => void
}

/** Maps a TeamPerson (coordinator or member) onto the presentational PersonCard. */
export function TeamPersonCard(props: TeamPersonCardProps) {
  return (
    <PersonCard
      name={props.person.name}
      nickname={props.person.nickname}
      badge={
        <ExperienceBadge
          experienceType={props.person.experienceType}
          circleKey={props.person.circleKey}
        />
      }
      phone={props.person.phone ?? undefined}
      avatarUrl={props.person.pictureUrl ?? undefined}
      attributes={props.person.areas}
      weekAvailability={props.person.weekAvailability}
      role={props.role}
      showStatusChips
      onRemove={props.onRemove}
    />
  )
}
