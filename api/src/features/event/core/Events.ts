import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import type {
  TeamCoordinator,
  TeamInstanceRepository,
} from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionOptionRepository } from '../../../modules/subscription-option/domain/SubscriptionOptionRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type {
  CurrentEventSubscriptionPayload,
  SubscriptionPayload,
  SubscriptionWithDetails,
} from '../domain/subscription-types.ts'
import type { TeamOverview, TeamsOverviewStats } from '../domain/team-overview.types.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { SubscriptionStatus } from '../../../modules/subscription/domain/subscription.types.ts'
import { getTeamSummaryBucket } from './team-summary.ts'
import { getTeamStatus, type TeamStatus } from './team-status.ts'

const DEFAULT_PAGE = 1
const DEFAULT_SIZE = 10
const DEFAULT_PAGE_SIZE = 20

export class Events {
  #teamInstanceRepository: TeamInstanceRepository
  #teamMembershipRepository: TeamMembershipRepository
  #subscriptionRepository: SubscriptionRepository
  #subscriptionOptionRepository: SubscriptionOptionRepository
  #userRepository: UserRepository
  #eventsRepository: EventRepository

  constructor(
    teamInstanceRepo: TeamInstanceRepository,
    subscriptionRepo: SubscriptionRepository,
    subscriptionOptionRepo: SubscriptionOptionRepository,
    userRepo: UserRepository,
    eventRepo: EventRepository,
    teamMembershipRepo: TeamMembershipRepository
  ) {
    this.#teamInstanceRepository = teamInstanceRepo
    this.#subscriptionRepository = subscriptionRepo
    this.#subscriptionOptionRepository = subscriptionOptionRepo
    this.#userRepository = userRepo
    this.#eventsRepository = eventRepo
    this.#teamMembershipRepository = teamMembershipRepo
  }

  async subscribe(eventId: string, userAuthId: string, input: SubscriptionPayload) {
    const user = await this.#userRepository.getUser(userAuthId)

    const subscriptionEvent = await this.#subscriptionRepository.getSubscriptionByUserAndEvent(
      user.id,
      eventId
    )

    if (subscriptionEvent) {
      throw new AppError(
        'User already subscribed to this event',
        AppErrorCode.UserAlreadySubscribed
      )
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
      gender: input.user.gender,
      experienceType: input.user.experienceType,
      hasCoordinatorExperience: input.user.hasCoordinatorExperience ?? false,
    })

    return subscription
  }

  async listTeams(eventId: string, teamKeys?: string[]) {
    const teams = await this.#listTeamInstances(eventId, teamKeys)
    return teams
  }

  async getCurrentEventTeams(filters?: {
    name?: string
    status?: TeamStatus
  }): Promise<TeamOverview[]> {
    const currentEvent = await this.#eventsRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    const instances = await this.#teamInstanceRepository.listTeamInstancesWithDetails(
      currentEvent.id
    )
    const teamInstanceIds = instances.map((instance) => instance.id)

    const [membershipUserIdsByTeam, coordinatorsByTeam] = await Promise.all([
      this.#teamMembershipRepository.listMemberUserIdsByTeamInstanceIds(teamInstanceIds),
      this.#teamInstanceRepository.listCoordinatorsByTeamInstanceIds(teamInstanceIds),
    ])

    const teams: TeamOverview[] = instances.map((instance) => {
      const coordinators = coordinatorsByTeam.get(instance.id) ?? []
      const memberCount = this.#countDistinctMembers(
        membershipUserIdsByTeam.get(instance.id) ?? [],
        coordinators.map((coordinator) => coordinator.id)
      )

      return {
        id: instance.id,
        templateKey: instance.templateKey,
        templateName: instance.templateName,
        templateDescription: instance.templateDescription,
        memberCount,
        maxCapacity: instance.maxCapacity,
        coordinators,
      }
    })

    return this.#filterTeams(teams, filters)
  }

  #filterTeams(teams: TeamOverview[], filters?: { name?: string; status?: TeamStatus }) {
    let filtered = teams

    if (filters?.status) {
      filtered = filtered.filter(
        (team) => getTeamStatus(team.memberCount, team.maxCapacity) === filters.status
      )
    }

    if (filters?.name) {
      const query = filters.name.trim().toLowerCase()
      filtered = filtered.filter(
        (team) =>
          team.templateName.toLowerCase().includes(query) ||
          team.coordinators.some((coordinator) => coordinator.name.toLowerCase().includes(query))
      )
    }

    return filtered
  }

  async getCurrentEventTeamsOverview(): Promise<{ stats: TeamsOverviewStats }> {
    const currentEvent = await this.#eventsRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    const instances = await this.#teamInstanceRepository.listTeamInstancesWithDetails(
      currentEvent.id
    )
    const teamInstanceIds = instances.map((instance) => instance.id)

    // The summary only needs how many distinct people fill each team, so it
    // resolves coordinator ids (which count towards the total) but not their
    // names.
    const [membershipUserIdsByTeam, coordinatorIdsByTeam] = await Promise.all([
      this.#teamMembershipRepository.listMemberUserIdsByTeamInstanceIds(teamInstanceIds),
      this.#teamInstanceRepository.listCoordinatorIdsByTeamInstanceIds(teamInstanceIds),
    ])

    const stats = instances.reduce<TeamsOverviewStats>(
      (acc, instance) => {
        const memberCount = this.#countDistinctMembers(
          membershipUserIdsByTeam.get(instance.id) ?? [],
          coordinatorIdsByTeam.get(instance.id) ?? []
        )
        const bucket = getTeamSummaryBucket(memberCount, instance.maxCapacity)
        acc[bucket] += 1
        acc.total += 1
        return acc
      },
      { completed: 0, partiallyCompleted: 0, inRisk: 0, total: 0 }
    )

    return { stats }
  }

  // Coordinators count as members, deduped against memberships so the same
  // person is never counted twice.
  #countDistinctMembers(membershipUserIds: string[], coordinatorIds: string[]) {
    const memberIds = new Set(membershipUserIds)
    for (const coordinatorId of coordinatorIds) {
      memberIds.add(coordinatorId)
    }
    return memberIds.size
  }

  async listSubscriptions(
    eventId: string,
    query?: { teamKeys?: string[]; name?: string },
    pagination?: { page?: number; size?: number }
  ) {
    const subscriptions = await this.#subscriptionRepository.listSubscriptionsByEventId(eventId)
    const teams = await this.#listTeamInstances(eventId, query?.teamKeys)
    let filteredSubscriptions = subscriptions

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

  async listCurrentEventSubscriptions(
    filters?: {
      teamKeys?: string[]
      name?: string
      status?: SubscriptionStatus[]
    },
    pagination?: { page?: number; pageSize?: number }
  ) {
    const currentEvent = await this.#eventsRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    const subscriptions = await this.#subscriptionRepository.listSubscriptionsByEventId(
      currentEvent.id
    )
    const allTeams = await this.#listTeamInstances(currentEvent.id)

    let filteredSubscriptions = subscriptions

    if (filters?.name) {
      filteredSubscriptions = this.#filterSubscriptionsByUserName(
        filters.name,
        filteredSubscriptions
      )
    }

    if (filters?.teamKeys && filters.teamKeys.length > 0) {
      const allowedTeams = allTeams.filter((team) => filters.teamKeys!.includes(team.templateKey))
      filteredSubscriptions = this.#filterSubscriptionsByTeams(allowedTeams, filteredSubscriptions)
    }

    if (filters?.status && filters.status.length > 0) {
      filteredSubscriptions = this.#filterSubscriptionsByStatus(
        filters.status,
        filteredSubscriptions
      )
    }

    const total = filteredSubscriptions.length
    const page = pagination?.page ?? DEFAULT_PAGE
    const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE

    const paginatedSubscriptions = this.#applyPagination(filteredSubscriptions, page, pageSize)

    const items = this.#formatSubscriptions(allTeams, paginatedSubscriptions, filters?.teamKeys)

    return { items, total, page, pageSize }
  }

  async getCurrentEventSubscriptionStats(): Promise<Record<SubscriptionStatus, number>> {
    const currentEvent = await this.#eventsRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    return this.#subscriptionRepository.countSubscriptionsByStatusForEvent(currentEvent.id)
  }

  async getCurrentEvent() {
    const currentEvent = await this.#eventsRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    return currentEvent
  }

  async getCurrentEventSubscriptionStatus(userAuthId: string) {
    const user = await this.#userRepository.getUser(userAuthId)
    const currentEvent = await this.#eventsRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    const subscription = await this.#subscriptionRepository.getSubscriptionByUserAndEvent(
      user.id,
      currentEvent.id
    )

    if (!subscription) {
      return {
        eventName: currentEvent.name,
        subscriptionStatus: null,
        assignedTeam: null,
        preferences: [],
      }
    }

    const team = await this.#teamInstanceRepository.findUserTeamForEvent(user.id, currentEvent.id)
    const preferences = await this.#subscriptionOptionRepository.listTeamOptionsBySubscription(
      subscription.id
    )

    let coordinators: TeamCoordinator[] = []

    if (team) {
      coordinators = await this.#teamInstanceRepository.listTeamCoordinators(team.id)
    }

    return {
      eventName: currentEvent.name,
      subscriptionStatus: subscription.status,
      assignedTeam: team ? { ...team, coordinators } : null,
      preferences,
    }
  }

  async subscribeCurrentEvent(userAuthId: string, input: CurrentEventSubscriptionPayload) {
    const user = await this.#userRepository.getUser(userAuthId)
    const currentEvent = await this.#eventsRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    const subscriptionEvent = await this.#subscriptionRepository.getSubscriptionByUserAndEvent(
      user.id,
      currentEvent.id
    )

    if (subscriptionEvent) {
      throw new AppError(
        'User already subscribed to this event',
        AppErrorCode.UserAlreadySubscribed
      )
    }

    const teamInstancesToSubscribe = await this.#teamInstanceRepository.listTeamInstances(
      currentEvent.id,
      {
        keys: input.selectedTeams,
      }
    )

    if (teamInstancesToSubscribe.length === 0) {
      throw new AppError('No team instances available for this event')
    }

    const subscriptionInput = {
      userId: user.id,
      eventId: currentEvent.id,
      availability: input.availability,
    }

    const subscription = await this.#subscriptionRepository.insertSubscription(subscriptionInput)

    if (!subscription) {
      throw new AppError('Failed to create subscription')
    }

    const subscriptionOptionsToSubscribe = input.selectedTeams.map((teamOption) => ({
      subscriptionId: subscription.id,
      teamInstanceId: teamInstancesToSubscribe.find(
        (instance) => instance.templateKey === teamOption
      )?.id as string,
    }))

    const subscriptionOptions = await this.#subscriptionOptionRepository.insertSubscriptionOptions(
      subscriptionOptionsToSubscribe
    )
    if (!subscriptionOptions) {
      throw new AppError('Failed to create subscription options')
    }

    const skills = this.#formatSkillsObject(input.selectedSkills)

    await this.#userRepository.updateUser(user.id, {
      ...skills,
      phone: input.phone,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      gender: input.gender,
      experienceType: input.experienceType,
      hasCoordinatorExperience: input.hasCoordinatorExperience ?? false,
    })

    return subscription
  }

  #filterSubscriptionsByStatus(
    statuses: SubscriptionStatus[],
    subscriptions: SubscriptionWithDetails[]
  ) {
    return subscriptions.filter((subscription) => statuses.includes(subscription.status))
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
    const startIndex = (page - 1) * size
    const endIndex = page * size
    return items.slice(startIndex, endIndex)
  }

  #formatSubscriptions(
    teamInstancesWithName: { id: string; name: string; templateKey: string }[],
    subscriptions: SubscriptionWithDetails[],
    priorityTeamKeys?: string[]
  ) {
    const priorityIds = new Set(
      priorityTeamKeys?.length
        ? teamInstancesWithName
            .filter((t) => priorityTeamKeys.includes(t.templateKey))
            .map((t) => t.id)
        : []
    )

    return subscriptions.map((subscription) => {
      const teams = subscription.teams
        .map((teamId) => teamInstancesWithName.find((team) => team.id === teamId))
        .filter((team): team is { id: string; name: string; templateKey: string } => Boolean(team))
        .sort((a, b) => {
          const aPriority = priorityIds.has(a.id) ? 0 : 1
          const bPriority = priorityIds.has(b.id) ? 0 : 1
          return aPriority - bPriority
        })
        .map((team) => ({ id: team.id, name: team.name }))

      return {
        id: subscription.id,
        user: subscription.user,
        status: subscription.status,
        createdAt: subscription.createdAt,
        teams,
      }
    })
  }

  #listTeamInstances(eventId: string, teamKeys?: string[]) {
    return this.#teamInstanceRepository.listTeamInstances(eventId, { keys: teamKeys })
  }

  #formatSkillsObject(skills: string[]) {
    const skillsObject: Record<string, boolean> = {
      hasActingSkills: skills.includes('has_acting_skills'),
      hasCommunicationSkills: skills.includes('has_communication_skills'),
      hasManualSkills: skills.includes('has_manual_skills'),
      hasCookingSkills: skills.includes('has_cooking_skills'),
      hasMusicSkills: skills.includes('has_music_skills'),
      hasDancingSkills: skills.includes('has_dancing_skills'),
      hasSingingSkills: skills.includes('has_singing_skills'),
    }

    return skillsObject
  }
}
