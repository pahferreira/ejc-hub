import { TeamBuilding } from '../core/TeamBuilding.ts'
import { teamInstanceRepository } from '../../../modules/team-instance/repository/DrizzleTeamInstanceRepository.ts'
import { teamMembershipRepository } from '../../../modules/team-membership/repository/DrizzleTeamMembershipRepository.ts'
import { subscriptionRepository } from '../../../modules/subscription/repository/DrizzleSubscriptionRepository.ts'
import { eventRepository } from '../../../modules/event/repository/DrizzleEventRepository.ts'

export const teamBuildingApp = new TeamBuilding(
  teamInstanceRepository,
  teamMembershipRepository,
  subscriptionRepository,
  eventRepository
)
