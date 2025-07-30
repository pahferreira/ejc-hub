import { Events } from '../core/Events.ts'
import { eventRepository } from '../repository/DrizzleEventRepository.ts'
import { teamTemplateRepository } from '../../team/repository/DrizzleTeamTemplateRepository.ts'
import { teamInstanceRepository } from '../../team/repository/DrizzleTeamInstanceRepository.ts'
import { subscriptionRepository } from '../../subscription/repository/DrizzleSubscriptionRepository.ts'
import { subscriptionOptionRepository } from '../../subscription/repository/DrizzleSubscriptionOptionRepository.ts'
import { userRepository } from '../../user/repository/DrizzleUserRepository.ts'

export const eventsApp = new Events(
  eventRepository,
  teamTemplateRepository,
  teamInstanceRepository,
  subscriptionRepository,
  subscriptionOptionRepository,
  userRepository
)
