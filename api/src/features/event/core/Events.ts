import { AppError } from '../../../shared/AppError.ts'
import type { EventRepository } from '../domain/EventRepository.ts'
import type { TeamTemplateRepository } from '../../team/domain/TeamTemplateRepository.ts'
import type { TeamInstanceRepository } from '../../team/domain/TeamInstanceRepository.ts'
import type { SubscriptionOptionRepository } from '../../subscription/domain/SubscriptionOptionRepository.ts'
import type { UserRepository } from '../../user/domain/UserRepository.ts'
import type { SubscriptionRepository } from '../../subscription/domain/SubscriptionRepository.ts'
import type { SubscriptionPayload } from '../domain/subscription-types.ts'

export class Events {
  #eventRepository: EventRepository
  #teamTemplateRepository: TeamTemplateRepository
  #teamInstanceRepository: TeamInstanceRepository
  #subscriptionRepository: SubscriptionRepository
  #subscriptionOptionRepository: SubscriptionOptionRepository
  #userRepository: UserRepository

  constructor(
    eventRepo: EventRepository,
    teamTemplateRepo: TeamTemplateRepository,
    teamInstanceRepo: TeamInstanceRepository,
    subscriptionRepo: SubscriptionRepository,
    subscriptionOptionRepo: SubscriptionOptionRepository,
    userRepo: UserRepository
  ) {
    this.#eventRepository = eventRepo
    this.#teamTemplateRepository = teamTemplateRepo
    this.#teamInstanceRepository = teamInstanceRepo
    this.#subscriptionRepository = subscriptionRepo
    this.#subscriptionOptionRepository = subscriptionOptionRepo
    this.#userRepository = userRepo
  }

  async listEvents() {
    const events = await this.#eventRepository.findAllEvents()
    return events
  }

  async getEvent(id: string) {
    const event = await this.#eventRepository.findEvent(id)

    if (!event) {
      throw new AppError('Event not found')
    }

    return event
  }

  async createEvent(input: { name: string; description: string }) {
    const createdEvent = await this.#eventRepository.insertEvent(input)
    await this.#createEventTeams(createdEvent.id)

    return createdEvent
  }

  async updateEvent(id: string, input: { name?: string; description?: string }) {
    const eventToUpdate = await this.#eventRepository.findEvent(id)
    if (!eventToUpdate) {
      throw new AppError('Event not found, please check the event id.')
    }

    const updatedEvent = await this.#eventRepository.updateEvent(id, input)
    return updatedEvent
  }

  async deleteEvent(id: string) {
    const deletedEvent = await this.#eventRepository.deleteEvent(id)
    return deletedEvent
  }

  async #createEventTeams(eventId: string) {
    const teamTemplates = await this.#teamTemplateRepository.listTeamTemplates()
    const templateIds = teamTemplates.map((template) => template.id)
    const teamInstances = await this.#teamInstanceRepository.bulkInsertTeamInstances(
      eventId,
      templateIds
    )

    return teamInstances
  }

  async subscribe(eventId: string, input: SubscriptionPayload) {
    const teamInstancesToSubscribe = await this.#teamInstanceRepository.listTeamInstances(eventId, {
      keys: input.options,
    })

    if (teamInstancesToSubscribe.length === 0) {
      throw new AppError('No team instances available for this event')
    }

    const subscriptionInput = {
      userId: input.user.id,
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

    await this.#userRepository.updateUser(input.user.id, {
      ...input.skills,
      emergencyContactName: input.user.emergencyContactName,
      emergencyContactPhone: input.user.emergencyContactPhone,
      experienceType: this.#defineExperienceType(
        input.user.isNewbie,
        input.hasCoordinatorExperience
      ),
    })

    return subscription
  }

  #defineExperienceType(isNewbie: boolean, hasCoordinatorExperience: boolean) {
    if (hasCoordinatorExperience) {
      return 'coordinator'
    }
    if (isNewbie) {
      return 'newbie'
    }
    return 'experienced'
  }
}
