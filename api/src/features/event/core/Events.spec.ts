import { describe, it, expect, vi, beforeEach } from 'vitest'

import { Events } from './Events.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { SubscriptionOptionRepository } from '../../../modules/subscription-option/domain/SubscriptionOptionRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { CircleRepository } from '../../../modules/circle/domain/CircleRepository.ts'
import type { CurrentEventSubscriptionPayload } from '../domain/subscription-types.ts'

const EVENT_ID = 'event-1'
const USER_ID = 'user-1'
const USER_AUTH_ID = 'auth|user-1'

function buildPayload(
  overrides: Partial<CurrentEventSubscriptionPayload> = {}
): CurrentEventSubscriptionPayload {
  return {
    fullName: 'Maria da Silva',
    nickname: 'Mari',
    email: 'mari@example.com',
    phone: '11999999999',
    emergencyContactName: 'João da Silva',
    emergencyContactPhone: '11888888888',
    gender: 'female',
    experienceType: 'experienced',
    hasCoordinatorExperience: true,
    selectedSkills: ['has_cooking_skills'],
    selectedTeams: ['cozinha'],
    previousExperienceTeams: ['cozinha'],
    availability: ['saturday', 'sunday'],
    ...overrides,
  }
}

describe('Events.subscribeCurrentEvent', () => {
  let userRepository: UserRepository
  let eventRepository: EventRepository
  let subscriptionRepository: SubscriptionRepository
  let subscriptionOptionRepository: SubscriptionOptionRepository
  let teamInstanceRepository: TeamInstanceRepository
  let circleRepository: CircleRepository
  let events: Events

  beforeEach(() => {
    userRepository = {
      getUser: vi.fn().mockResolvedValue({ id: USER_ID, authId: USER_AUTH_ID }),
      createUser: vi.fn(),
      updateUser: vi.fn().mockResolvedValue({ id: USER_ID }),
    } as unknown as UserRepository

    eventRepository = {
      findCurrentEvent: vi
        .fn()
        .mockResolvedValue({ id: EVENT_ID, name: 'EJC 2026', subscriptionsOpen: true }),
    } as unknown as EventRepository

    subscriptionRepository = {
      getSubscriptionByUserAndEvent: vi.fn().mockResolvedValue(undefined),
      insertSubscription: vi.fn().mockResolvedValue({ id: 'subscription-1' }),
    } as unknown as SubscriptionRepository

    subscriptionOptionRepository = {
      insertSubscriptionOptions: vi.fn().mockResolvedValue([{ id: 'option-1' }]),
    } as unknown as SubscriptionOptionRepository

    teamInstanceRepository = {
      listTeamInstances: vi.fn().mockResolvedValue([{ id: 'instance-1', templateKey: 'cozinha' }]),
    } as unknown as TeamInstanceRepository

    circleRepository = {
      getCircleByKey: vi.fn().mockResolvedValue({ id: 'circle-1', key: 'red' }),
    } as unknown as CircleRepository

    events = new Events(
      teamInstanceRepository,
      subscriptionRepository,
      subscriptionOptionRepository,
      userRepository,
      eventRepository,
      {} as TeamMembershipRepository,
      circleRepository
    )
  })

  it('rejects the subscription when subscriptions are closed for the current event', async () => {
    vi.mocked(eventRepository.findCurrentEvent).mockResolvedValue({
      id: EVENT_ID,
      name: 'EJC 2026',
      subscriptionsOpen: false,
    } as unknown as Awaited<ReturnType<EventRepository['findCurrentEvent']>>)

    await expect(events.subscribeCurrentEvent(USER_AUTH_ID, buildPayload())).rejects.toThrow(
      'Subscriptions are closed for this event'
    )

    expect(subscriptionRepository.insertSubscription).not.toHaveBeenCalled()
  })

  it('persists details, previous experience teams and workingAnotherEvent on the subscription', async () => {
    const payload = buildPayload({
      details: 'Só posso à noite',
      previousExperienceTeams: ['cozinha', 'garcom'],
      workingAnotherEvent: true,
    })

    await events.subscribeCurrentEvent(USER_AUTH_ID, payload)

    expect(subscriptionRepository.insertSubscription).toHaveBeenCalledWith({
      userId: USER_ID,
      eventId: EVENT_ID,
      availability: ['saturday', 'sunday'],
      details: 'Só posso à noite',
      previousExperienceTeams: ['cozinha', 'garcom'],
      workingAnotherEvent: true,
    })
  })

  it('updates the user with instagram and dateOfBirth converted to a Date', async () => {
    const payload = buildPayload({
      instagram: '@mari',
      dateOfBirth: '1998-04-15',
    })

    await events.subscribeCurrentEvent(USER_AUTH_ID, payload)

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        instagram: '@mari',
        dateOfBirth: new Date('1998-04-15'),
      })
    )
  })

  it('updates the user name and nickname from the form values', async () => {
    await events.subscribeCurrentEvent(USER_AUTH_ID, buildPayload())

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ name: 'Maria da Silva', nickname: 'Mari' })
    )
  })

  it('keeps the optional fields undefined when they are not provided', async () => {
    await events.subscribeCurrentEvent(USER_AUTH_ID, buildPayload())

    expect(subscriptionRepository.insertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ workingAnotherEvent: undefined })
    )
    expect(userRepository.updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ instagram: undefined, dateOfBirth: undefined })
    )
  })

  it('resolves the circle key and stores the circle id for newbie subscriptions', async () => {
    await events.subscribeCurrentEvent(
      USER_AUTH_ID,
      buildPayload({ experienceType: 'newbie', circle: 'red', previousExperienceTeams: [] })
    )

    expect(circleRepository.getCircleByKey).toHaveBeenCalledWith('red')
    expect(userRepository.updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ circleId: 'circle-1' })
    )
  })

  it('rejects a newbie subscription without a circle', async () => {
    await expect(
      events.subscribeCurrentEvent(
        USER_AUTH_ID,
        buildPayload({ experienceType: 'newbie', previousExperienceTeams: [] })
      )
    ).rejects.toThrow('Circle is required for newbie subscriptions')

    expect(subscriptionRepository.insertSubscription).not.toHaveBeenCalled()
  })

  it('rejects a newbie subscription with an unknown circle key', async () => {
    vi.mocked(circleRepository.getCircleByKey).mockResolvedValue(undefined)

    await expect(
      events.subscribeCurrentEvent(
        USER_AUTH_ID,
        buildPayload({ experienceType: 'newbie', circle: 'purple', previousExperienceTeams: [] })
      )
    ).rejects.toThrow('Circle "purple" not found')
  })

  it('stores a null circle id and skips circle lookup for non-newbie subscriptions', async () => {
    await events.subscribeCurrentEvent(USER_AUTH_ID, buildPayload({ circle: 'red' }))

    expect(circleRepository.getCircleByKey).not.toHaveBeenCalled()
    expect(userRepository.updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ circleId: null })
    )
  })

  it('persists groups and alreadyWorked* fields on both the subscription and the user for outsiders', async () => {
    const payload = buildPayload({
      experienceType: 'experienced_outsider',
      previousExperienceTeams: [],
      alreadyWorkedHere: true,
      alreadyWorkedEvent: 'EJC 2024',
      alreadyWorkedTeams: 'cozinha, som',
      groups: 'should be ignored',
    })

    await events.subscribeCurrentEvent(USER_AUTH_ID, payload)

    expect(subscriptionRepository.insertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        alreadyWorkedHere: true,
        alreadyWorkedEvent: 'EJC 2024',
        alreadyWorkedTeams: 'cozinha, som',
        groups: undefined,
      })
    )
    expect(userRepository.updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        alreadyWorkedHere: true,
        alreadyWorkedEvent: 'EJC 2024',
        alreadyWorkedTeams: 'cozinha, som',
        groups: undefined,
      })
    )
  })

  it('persists groups for newbie/experienced subscriptions and gates alreadyWorked* to undefined', async () => {
    const payload = buildPayload({
      experienceType: 'experienced',
      groups: 'grupo de oração',
      alreadyWorkedHere: true,
      alreadyWorkedEvent: 'EJC 2024',
      alreadyWorkedTeams: 'cozinha',
    })

    await events.subscribeCurrentEvent(USER_AUTH_ID, payload)

    expect(subscriptionRepository.insertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        groups: 'grupo de oração',
        alreadyWorkedHere: undefined,
        alreadyWorkedEvent: undefined,
        alreadyWorkedTeams: undefined,
      })
    )
    expect(userRepository.updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        groups: 'grupo de oração',
        alreadyWorkedHere: undefined,
        alreadyWorkedEvent: undefined,
        alreadyWorkedTeams: undefined,
      })
    )
  })

  it('clears alreadyWorkedEvent/alreadyWorkedTeams when alreadyWorkedHere is falsy for outsiders', async () => {
    const payload = buildPayload({
      experienceType: 'experienced_outsider',
      previousExperienceTeams: [],
      alreadyWorkedHere: false,
      alreadyWorkedEvent: 'EJC 2024',
      alreadyWorkedTeams: 'cozinha',
    })

    await events.subscribeCurrentEvent(USER_AUTH_ID, payload)

    expect(subscriptionRepository.insertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        alreadyWorkedHere: false,
        alreadyWorkedEvent: undefined,
        alreadyWorkedTeams: undefined,
      })
    )
    expect(userRepository.updateUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        alreadyWorkedHere: false,
        alreadyWorkedEvent: undefined,
        alreadyWorkedTeams: undefined,
      })
    )
  })
})
