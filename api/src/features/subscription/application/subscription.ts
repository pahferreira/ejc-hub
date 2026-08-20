import { Subscription } from '../core/Subscription.ts'
import { subscriptionRepository } from '../../../modules/subscription/repository/DrizzleSubscriptionRepository.ts'
import { teamMembershipRepository } from '../../../modules/team-membership/repository/DrizzleTeamMembershipRepository.ts'

export const subscriptionApp = new Subscription(subscriptionRepository, teamMembershipRepository)
