import { Badge, type BadgeVariant } from '../Badge/Badge'
import { experienceLabels } from '../../pages/TeamBuildingPage/experience'
import type { ExperienceType } from '../../services/team-building/team-building.types'

const experienceVariant: Record<ExperienceType, BadgeVariant> = {
  newbie: 'warning',
  experienced: 'warning',
  experienced_outsider: 'default',
}

const circleKeyVariant: Record<string, BadgeVariant> = {
  green: 'success',
  red: 'error',
  blue: 'info',
}

export type ExperienceBadgeProps = {
  experienceType: ExperienceType
  /** The subscriber's circle key; colors the badge for newbies. Falls back to warning when absent. */
  circleKey?: string | null
}

export function ExperienceBadge(props: ExperienceBadgeProps) {
  const variant =
    props.experienceType === 'newbie'
      ? (circleKeyVariant[props.circleKey ?? ''] ?? experienceVariant.newbie)
      : experienceVariant[props.experienceType]

  return <Badge variant={variant}>{experienceLabels[props.experienceType]}</Badge>
}
