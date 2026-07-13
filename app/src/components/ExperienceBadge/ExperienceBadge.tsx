import { Badge, type BadgeVariant } from '../Badge/Badge'
import { experienceLabels } from '../../pages/TeamBuildingPage/experience'
import type { ExperienceType } from '../../services/team-building/team-building.types'

const experienceVariant: Record<ExperienceType, BadgeVariant> = {
  newbie: 'success',
  experienced: 'warning',
  experienced_outsider: 'default',
}

export type ExperienceBadgeProps = {
  experienceType: ExperienceType
}

export function ExperienceBadge(props: ExperienceBadgeProps) {
  return (
    <Badge variant={experienceVariant[props.experienceType]}>
      {experienceLabels[props.experienceType]}
    </Badge>
  )
}
