import { describe, it, expect, vi, beforeEach } from 'vitest'

import { Events } from './Events.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { SubscriptionOptionRepository } from '../../../modules/subscription-option/domain/SubscriptionOptionRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
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
  let events: Events

  beforeEach(() => {
    userRepository = {
      getUser: vi.fn().mockResolvedValue({ id: USER_ID, authId: USER_AUTH_ID }),
      createUser: vi.fn(),
      updateUser: vi.fn().mockResolvedValue({ id: USER_ID }),
    } as unknown as UserRepository

    eventRepository = {
      findCurrentEvent: vi.fn().mockResolvedValue({ id: EVENT_ID, name: 'EJC 2026' }),
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

    events = new Events(
      teamInstanceRepository,
      subscriptionRepository,
      subscriptionOptionRepository,
      userRepository,
      eventRepository,
      {} as TeamMembershipRepository
    )
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
})
