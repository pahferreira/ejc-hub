import { Subscription } from '../core/Subscription.ts'
import { subscriptionRepository } from '../../../modules/subscription/repository/DrizzleSubscriptionRepository.ts'
import { teamMembershipRepository } from '../../../modules/team-membership/repository/DrizzleTeamMembershipRepository.ts'
import { memberRequestRepository } from '../../../modules/member-request/repository/DrizzleMemberRequestRepository.ts'

export const subscriptionApp = new Subscription(
  subscriptionRepository,
  teamMembershipRepository,
  memberRequestRepository
)
