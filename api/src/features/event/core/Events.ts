import { AppError } from '../../../shared/AppError.ts'
import type { TeamInstanceRepository } from '../../team/domain/TeamInstanceRepository.ts'
import type { SubscriptionOptionRepository } from '../../subscription/domain/SubscriptionOptionRepository.ts'
import type { UserRepository } from '../../user/domain/UserRepository.ts'
import type { SubscriptionRepository } from '../../subscription/domain/SubscriptionRepository.ts'
import type { SubscriptionPayload } from '../domain/subscription-types.ts'
import type { SubscriptionWithDetails } from '../../subscription/domain/subscription.types.ts'
import type { EventRepository } from '../domain/EventRepository.ts'

const DEFAULT_PAGE = 1
const DEFAULT_SIZE = 10

export class Events {
  #teamInstanceRepository: TeamInstanceRepository
  #subscriptionRepository: SubscriptionRepository
  #subscriptionOptionRepository: SubscriptionOptionRepository
  #userRepository: UserRepository
  #eventsRepository: EventRepository

  constructor(
    teamInstanceRepo: TeamInstanceRepository,
    subscriptionRepo: SubscriptionRepository,
    subscriptionOptionRepo: SubscriptionOptionRepository,
    userRepo: UserRepository,
    eventRepo: EventRepository
  ) {
    this.#teamInstanceRepository = teamInstanceRepo
    this.#subscriptionRepository = subscriptionRepo
    this.#subscriptionOptionRepository = subscriptionOptionRepo
    this.#userRepository = userRepo
    this.#eventsRepository = eventRepo
  }

  async subscribe(eventId: string, userAuthId: string, input: SubscriptionPayload) {
    const user = await this.#userRepository.getUser(userAuthId)

    const subscriptionEvent = await this.#subscriptionRepository.getSubscriptionByUserAndEvent(
      user.id,
      eventId
    )

    if (subscriptionEvent) {
      throw new AppError('User already subscribed to this event')
    }

    const teamInstancesToSubscribe = await this.#teamInstanceRepository.listTeamInstances(eventId, {
      keys: input.options,
    })

    if (teamInstancesToSubscribe.length === 0) {
      throw new AppError('No team instances available for this event')
    }

    const subscriptionInput = {
      userId: user.id,
      eventId: eventId,
      availability: input.availability,
    }

    const subscription = await this.#subscriptionRepository.insertSubscription(subscriptionInput)

    if (!subscription) {
      throw new AppError('Failed to create subscription')
    }

    const subscriptionOptionsToSubscribe = input.options.map((option) => ({
      subscriptionId: subscription.id,
      teamInstanceId: teamInstancesToSubscribe.find((instance) => instance.templateKey === option)
        ?.id as string,
    }))

    const subscriptionOptions = await this.#subscriptionOptionRepository.insertSubscriptionOptions(
      subscriptionOptionsToSubscribe
    )
    if (!subscriptionOptions) {
      throw new AppError('Failed to create subscription options')
    }

    await this.#userRepository.updateUser(user.id, {
      ...input.skills,
      emergencyContactName: input.user.emergencyContactName,
      emergencyContactPhone: input.user.emergencyContactPhone,
      experienceType: this.#defineExperienceType(
        input.user.isNewbie,
        input.user.hasCoordinatorExperience
      ),
    })

    return subscription
  }

  async listTeams(eventId: string, teamKeys?: string[]) {
    const teams = await this.#listTeamInstances(eventId, teamKeys)
    return teams
  }

  async listSubscriptions(
    eventId: string,
    query?: { teamKeys?: string[]; name?: string },
    pagination?: { page?: number; size?: number }
  ) {
    const subscriptions = await this.#subscriptionRepository.listSubscriptionsByEventId(eventId)
    const teams = await this.#listTeamInstances(eventId, query?.teamKeys)
    let filteredSubscriptions = [...subscriptions]

    if (query?.name) {
      filteredSubscriptions = this.#filterSubscriptionsByUserName(query.name, filteredSubscriptions)
    }

    if (query?.teamKeys && query.teamKeys.length > 0) {
      filteredSubscriptions = this.#filterSubscriptionsByTeams(teams, filteredSubscriptions)
    }

    filteredSubscriptions = this.#applyPagination(
      filteredSubscriptions,
      pagination?.page,
      pagination?.size
    )

    return this.#formatSubscriptions(teams, filteredSubscriptions)
  }

  async getCurrentEvent() {
    const currentEvent = await this.#eventsRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    return currentEvent
  }

  async receiveSubscription(subscriptionId: string) {
    const subscription = await this.#subscriptionRepository.getSubscription(subscriptionId)

    if (!subscription) {
      throw new AppError('Subscription not found')
    }

    const updatedSubscription = await this.#subscriptionRepository.updateSubscriptionStatus(
      subscriptionId,
      'received'
    )

    return updatedSubscription
  }

  async onHoldSubscription(subscriptionId: string) {
    const subscription = await this.#subscriptionRepository.getSubscription(subscriptionId)

    if (!subscription) {
      throw new AppError('Subscription not found')
    }

    const updatedSubscription = await this.#subscriptionRepository.updateSubscriptionStatus(
      subscriptionId,
      'waiting_list'
    )

    return updatedSubscription
  }

  #defineExperienceType(isNewbie?: boolean, hasCoordinatorExperience?: boolean) {
    if (hasCoordinatorExperience) {
      return 'coordinator'
    }
    if (isNewbie) {
      return 'newbie'
    }
    return 'experienced'
  }

  #filterSubscriptionsByUserName(userName: string, subscriptions: SubscriptionWithDetails[]) {
    return subscriptions.filter((subscription) =>
      subscription.user.name.toLowerCase().includes(userName.toLowerCase())
    )
  }

  #filterSubscriptionsByTeams(
    teamInstancesWithKey: { id: string; templateKey: string }[],
    subscriptions: SubscriptionWithDetails[]
  ) {
    const allowedTeamIds = teamInstancesWithKey.map((team) => team.id)

    return subscriptions.filter((subscription) =>
      subscription.teams.some((team) => allowedTeamIds.includes(team))
    )
  }

  #applyPagination(
    items: SubscriptionWithDetails[],
    page: number = DEFAULT_PAGE,
    size: number = DEFAULT_SIZE
  ) {
    if (items.length === 0) {
      return []
    }

    const startIndex = (page - 1) * size
    const endIndex = page * size
    return items.slice(startIndex, endIndex)
  }

  #formatSubscriptions(
    teamInstancesWithName: { id: string; name: string }[],
    subscriptions: SubscriptionWithDetails[]
  ) {
    return subscriptions.map((subscription) => ({
      id: subscription.id,
      user: subscription.user,
      status: subscription.status,
      teams: subscription.teams.map((teamId) => {
        const team = teamInstancesWithName.find((team) => team.id === teamId)
        return {
          id: team?.id,
          name: team?.name,
        }
      }),
    }))
  }

  #listTeamInstances(eventId: string, teamKeys?: string[]) {
    return this.#teamInstanceRepository.listTeamInstances(eventId, { keys: teamKeys })
  }
}
