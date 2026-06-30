import { TeamBuildingCard } from '../../components/TeamBuildingCard/TeamBuildingCard'
import { experienceLabels } from './experience'
import type { TeamBoardMember } from '../../services/team-building/team-building.types'

export type MemberCardProps = {
  member: TeamBoardMember
}

/** Maps a board member onto the presentational TeamBuildingCard. */
export function MemberCard(props: MemberCardProps) {
  const experience = experienceLabels[props.member.experienceType]

  return (
    <TeamBuildingCard
      name={props.member.name}
      nickname={props.member.nickname}
      badge={experience.label}
      badgeVariant={experience.variant}
      phone={props.member.phone ?? undefined}
      attributes={props.member.areas}
      preferences={props.member.preferences}
    />
  )
}
