import { TeamBuildingCard } from '../../components/TeamBuildingCard/TeamBuildingCard'
import { ExperienceBadge } from '../../components/ExperienceBadge/ExperienceBadge'
import type { TeamBoardMember } from '../../services/team-building/team-building.types'

export type MemberCardProps = {
  member: TeamBoardMember
}

/** Maps a board member onto the presentational TeamBuildingCard. */
export function MemberCard(props: MemberCardProps) {
  return (
    <TeamBuildingCard
      name={props.member.name}
      nickname={props.member.nickname}
      badge={
        <ExperienceBadge
          experienceType={props.member.experienceType}
          circleKey={props.member.circleKey}
        />
      }
      phone={props.member.phone ?? undefined}
      avatarUrl={props.member.pictureUrl ?? undefined}
      attributes={props.member.areas}
      preferences={props.member.preferences}
      weekAvailability={props.member.weekAvailability}
      isCoordinator={props.member.isCoordinator}
    />
  )
}
