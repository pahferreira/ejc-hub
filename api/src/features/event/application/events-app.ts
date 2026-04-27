import { Events } from '../core/Events.ts'
import { teamInstanceRepository } from '../../../modules/team-instance/repository/DrizzleTeamInstanceRepository.ts'
import { subscriptionRepository } from '../../../modules/subscription/repository/DrizzleSubscriptionRepository.ts'
import { subscriptionOptionRepository } from '../../../modules/subscription-option/repository/DrizzleSubscriptionOptionRepository.ts'
import { userRepository } from '../../../modules/user/repository/DrizzleUserRepository.ts'
import { eventRepository } from '../../../modules/event/repository/DrizzleEventRepository.ts'

export const eventsApp = new Events(
  teamInstanceRepository,
  subscriptionRepository,
  subscriptionOptionRepository,
  userRepository,
  eventRepository
)
