import { Events } from '../core/Events.ts'
import { teamInstanceRepository } from '../../team/repository/DrizzleTeamInstanceRepository.ts'
import { subscriptionRepository } from '../../subscription/repository/DrizzleSubscriptionRepository.ts'
import { subscriptionOptionRepository } from '../../subscription/repository/DrizzleSubscriptionOptionRepository.ts'
import { userRepository } from '../../user/repository/DrizzleUserRepository.ts'
import { eventRepository } from '../repository/DrizzleEventRepository.ts'

export const eventsApp = new Events(
  teamInstanceRepository,
  subscriptionRepository,
  subscriptionOptionRepository,
  userRepository,
  eventRepository
)
