import { describe, it, expect, vi, beforeEach } from 'vitest'

import { Events } from './Events.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { SubscriptionOptionRepository } from '../../../modules/subscription-option/domain/SubscriptionOptionRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { CircleRepository } from '../../../modules/circle/domain/CircleRepository.ts'
import type { EventFeePaymentRepository } from '../../../modules/event-fee-payment/domain/EventFeePaymentRepository.ts'
import type { CurrentEventSubscriptionPayload } from '../domain/subscription-types.ts'

const EVENT_ID = 'event-1'
const USER_ID = 'user-1'
const USER_AUTH_ID = 'auth|user-1'
const TEAM_ID = 'team-1'

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
      circleRepository,
      {} as EventFeePaymentRepository
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

describe('Events.getCurrentEventTeamDetail', () => {
  const TEAM_INSTANCE_ID = 'instance-1'
  const TEAM_KEY = 'liturgia'

  const noSkills = {
    hasActingSkills: false,
    hasCommunicationSkills: false,
    hasCookingSkills: false,
    hasDancingSkills: false,
    hasManualSkills: false,
    hasMusicSkills: false,
    hasSingingSkills: false,
    hasGuitarSkills: false,
    hasPercussionSkills: false,
    hasMidiaSkills: false,
  }

  function buildSubscription(userId: string, overrides: Record<string, unknown> = {}) {
    return {
      id: `sub-${userId}`,
      userId,
      status: 'received',
      createdAt: new Date(),
      availability: ['saturday'],
      teams: [],
      user: {
        name: `User ${userId}`,
        nickname: null,
        email: `${userId}@example.com`,
        phone: null,
        pictureUrl: null,
        experienceType: 'experienced',
        circle: null,
        hasCoordinatorExperience: false,
        ...noSkills,
      },
      ...overrides,
    }
  }

  function makeEvents(opts: {
    subscriptions: ReturnType<typeof buildSubscription>[]
    memberUserIds?: string[]
    coordinatorUserIds?: string[]
    maxCapacity?: number
    maxAllowedCoordinators?: number
    /** Stored `event_fee_payments.status` per user id; absent means no row. */
    feeStatusByUserId?: Record<string, string>
  }) {
    const eventRepository = {
      findCurrentEvent: vi.fn().mockResolvedValue({ id: EVENT_ID }),
    } as unknown as EventRepository

    const teamInstanceRepository = {
      listTeamInstancesWithDetails: vi.fn().mockResolvedValue([
        {
          id: TEAM_INSTANCE_ID,
          eventId: EVENT_ID,
          templateKey: TEAM_KEY,
          templateName: 'Liturgia',
          templateDescription: 'Cuida da liturgia',
          maxCapacity: opts.maxCapacity ?? 10,
          maxAllowedCoordinators: opts.maxAllowedCoordinators ?? 3,
        },
      ]),
    } as unknown as TeamInstanceRepository

    const teamMembershipRepository = {
      listMemberUserIdsByTeamInstanceIds: vi
        .fn()
        .mockResolvedValue(new Map([[TEAM_INSTANCE_ID, opts.memberUserIds ?? []]])),
      getCoordinatorUserIds: vi.fn().mockResolvedValue(opts.coordinatorUserIds ?? []),
    } as unknown as TeamMembershipRepository

    const subscriptionRepository = {
      listSubscriptionsByEventId: vi.fn().mockResolvedValue(opts.subscriptions),
    } as unknown as SubscriptionRepository

    const eventFeePaymentRepository = {
      listPaymentStatusesByUserIds: vi
        .fn()
        .mockResolvedValue(new Map(Object.entries(opts.feeStatusByUserId ?? {}))),
    } as unknown as EventFeePaymentRepository

    const events = new Events(
      teamInstanceRepository,
      subscriptionRepository,
      {} as SubscriptionOptionRepository,
      {} as UserRepository,
      eventRepository,
      teamMembershipRepository,
      {} as CircleRepository,
      eventFeePaymentRepository
    )

    return {
      events,
      teamInstanceRepository,
      teamMembershipRepository,
      subscriptionRepository,
      eventFeePaymentRepository,
    }
  }

  it('resolves the team by templateKey', async () => {
    const { events } = makeEvents({ subscriptions: [] })

    const detail = await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(detail.id).toBe(TEAM_INSTANCE_ID)
    expect(detail.templateKey).toBe(TEAM_KEY)
    expect(detail.name).toBe('Liturgia')
    expect(detail.description).toBe('Cuida da liturgia')
    expect(detail.coordinatorSlots).toBe(3)
  })

  it('exposes coordinatorSlots from the template maxAllowedCoordinators', async () => {
    const { events } = makeEvents({ subscriptions: [], maxAllowedCoordinators: 4 })

    const detail = await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(detail.coordinatorSlots).toBe(4)
  })

  it('throws when the teamKey does not match any team in the current event', async () => {
    const { events } = makeEvents({ subscriptions: [] })

    await expect(events.getCurrentEventTeamDetail('unknown-key')).rejects.toThrow(/not found/)
  })

  it('keeps coordinators and members as disjoint lists', async () => {
    // Members (type='member') and coordinators (type='coordinator') can never
    // share a user id for the same team instance — enforced by the
    // team_memberships (team_instance_id, user_id) unique constraint — so a
    // coordinator never also appears in memberUserIds.
    const coordinatorSub = buildSubscription('coord-1')
    const memberSub = buildSubscription('member-1')
    const { events } = makeEvents({
      subscriptions: [coordinatorSub, memberSub],
      memberUserIds: ['member-1'],
      coordinatorUserIds: ['coord-1'],
    })

    const detail = await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(detail.coordinators.map((c) => c.userId)).toEqual(['coord-1'])
    expect(detail.members.map((m) => m.userId)).toEqual(['member-1'])
  })

  it('computes memberCount, freeSlots and filledPercentage counting both coordinators and members', async () => {
    const coordinatorSub = buildSubscription('coord-1')
    const memberSub = buildSubscription('member-1')
    const { events } = makeEvents({
      subscriptions: [coordinatorSub, memberSub],
      memberUserIds: ['member-1'],
      coordinatorUserIds: ['coord-1'],
      maxCapacity: 4,
    })

    const detail = await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(detail.memberCount).toBe(2)
    expect(detail.maxCapacity).toBe(4)
    expect(detail.freeSlots).toBe(2)
    expect(detail.filledPercentage).toBe(50)
  })

  it('returns the team coordinators', async () => {
    const first = buildSubscription('coord-1')
    const third = buildSubscription('coord-3')
    const { events } = makeEvents({
      subscriptions: [first, third],
      coordinatorUserIds: ['coord-1', 'coord-3'],
    })

    const detail = await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(detail.coordinators.map((c) => c.userId)).toEqual(['coord-1', 'coord-3'])
  })

  it('marks a roster member as paid once their fee is recorded', async () => {
    const { events } = makeEvents({
      subscriptions: [buildSubscription('member-1')],
      memberUserIds: ['member-1'],
      feeStatusByUserId: { 'member-1': 'paid' },
    })

    const detail = await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(detail.members[0].eventFeeStatus).toBe('paid')
  })

  it('marks a roster member with no payment row as pending', async () => {
    // Most people have no row at all until someone records a status.
    const { events } = makeEvents({
      subscriptions: [buildSubscription('member-1')],
      memberUserIds: ['member-1'],
      feeStatusByUserId: {},
    })

    const detail = await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(detail.members[0].eventFeeStatus).toBe('pending')
  })

  it('reads a comped fee as settled, since the member owes nothing', async () => {
    const { events } = makeEvents({
      subscriptions: [buildSubscription('member-1')],
      memberUserIds: ['member-1'],
      feeStatusByUserId: { 'member-1': 'exempt' },
    })

    const detail = await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(detail.members[0].eventFeeStatus).toBe('paid')
  })

  it.each(['pending', 'not_paid', 'refunded'])('reads a %s fee as outstanding', async (status) => {
    const { events } = makeEvents({
      subscriptions: [buildSubscription('member-1')],
      memberUserIds: ['member-1'],
      feeStatusByUserId: { 'member-1': status },
    })

    const detail = await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(detail.members[0].eventFeeStatus).toBe('pending')
  })

  it('reports a fee status for coordinators too, who owe the fee like everyone else', async () => {
    const { events } = makeEvents({
      subscriptions: [buildSubscription('coord-1')],
      coordinatorUserIds: ['coord-1'],
      feeStatusByUserId: { 'coord-1': 'paid' },
    })

    const detail = await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(detail.coordinators[0].eventFeeStatus).toBe('paid')
  })

  it('reads the whole roster in a single batched query rather than one call per person', async () => {
    // The guard against an N+1 on a page-load endpoint.
    const { events, eventFeePaymentRepository } = makeEvents({
      subscriptions: [
        buildSubscription('coord-1'),
        buildSubscription('member-1'),
        buildSubscription('member-2'),
      ],
      coordinatorUserIds: ['coord-1'],
      memberUserIds: ['member-1', 'member-2'],
    })

    await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(eventFeePaymentRepository.listPaymentStatusesByUserIds).toHaveBeenCalledTimes(1)
  })

  it('asks for the coordinators and members of the team in one id list', async () => {
    const { events, eventFeePaymentRepository } = makeEvents({
      subscriptions: [buildSubscription('coord-1'), buildSubscription('member-1')],
      coordinatorUserIds: ['coord-1'],
      memberUserIds: ['member-1'],
    })

    await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(eventFeePaymentRepository.listPaymentStatusesByUserIds).toHaveBeenCalledWith(EVENT_ID, [
      'coord-1',
      'member-1',
    ])
  })

  it('does not ask for the same person twice when ids overlap', async () => {
    // Belt and braces: memberships and coordinators are disjoint by constraint,
    // but the roster list must not be able to send a duplicate to `inArray`.
    const { events, eventFeePaymentRepository } = makeEvents({
      subscriptions: [buildSubscription('person-1')],
      coordinatorUserIds: ['person-1'],
      memberUserIds: ['person-1'],
    })

    await events.getCurrentEventTeamDetail(TEAM_KEY)

    expect(eventFeePaymentRepository.listPaymentStatusesByUserIds).toHaveBeenCalledWith(EVENT_ID, [
      'person-1',
    ])
  })

  it('rejects when there is no current event', async () => {
    const { teamInstanceRepository } = makeEvents({ subscriptions: [] })

    const eventRepository = {
      findCurrentEvent: vi.fn().mockResolvedValue(undefined),
    } as unknown as EventRepository

    const eventsWithoutCurrentEvent = new Events(
      teamInstanceRepository,
      {} as SubscriptionRepository,
      {} as SubscriptionOptionRepository,
      {} as UserRepository,
      eventRepository,
      {} as TeamMembershipRepository,
      {} as CircleRepository,
      {} as EventFeePaymentRepository
    )

    await expect(eventsWithoutCurrentEvent.getCurrentEventTeamDetail(TEAM_KEY)).rejects.toThrow(
      'Current event not set'
    )
  })
})

describe('Events.getMyCurrentEventTeamDetail', () => {
  const TEAM_INSTANCE_ID = 'instance-1'
  const TEAM_KEY = 'liturgia'

  function makeEvents(opts: {
    user?: { id: string } | undefined
    currentEvent?: { id: string } | undefined
    assignedTeam?: { id: string; name: string; description: string | null } | undefined
  }) {
    const userRepository = {
      getUser: vi.fn().mockResolvedValue(opts.user),
    } as unknown as UserRepository

    const eventRepository = {
      findCurrentEvent: vi.fn().mockResolvedValue(opts.currentEvent),
    } as unknown as EventRepository

    const teamInstanceRepository = {
      findUserTeamForEvent: vi.fn().mockResolvedValue(opts.assignedTeam),
      listTeamInstancesWithDetails: vi.fn().mockResolvedValue([
        {
          id: TEAM_INSTANCE_ID,
          eventId: EVENT_ID,
          templateKey: TEAM_KEY,
          templateName: 'Liturgia',
          templateDescription: 'Cuida da liturgia',
          maxCapacity: 10,
          maxAllowedCoordinators: 3,
        },
      ]),
    } as unknown as TeamInstanceRepository

    const teamMembershipRepository = {
      listMemberUserIdsByTeamInstanceIds: vi
        .fn()
        .mockResolvedValue(new Map([[TEAM_INSTANCE_ID, []]])),
      getCoordinatorUserIds: vi.fn().mockResolvedValue([]),
    } as unknown as TeamMembershipRepository

    const subscriptionRepository = {
      listSubscriptionsByEventId: vi.fn().mockResolvedValue([]),
    } as unknown as SubscriptionRepository

    const eventFeePaymentRepository = {
      listPaymentStatusesByUserIds: vi.fn().mockResolvedValue(new Map()),
    } as unknown as EventFeePaymentRepository

    const events = new Events(
      teamInstanceRepository,
      subscriptionRepository,
      {} as SubscriptionOptionRepository,
      userRepository,
      eventRepository,
      teamMembershipRepository,
      {} as CircleRepository,
      eventFeePaymentRepository
    )

    return { events }
  }

  it('returns the full team detail for the team the user belongs to', async () => {
    const { events } = makeEvents({
      user: { id: USER_ID },
      currentEvent: { id: EVENT_ID },
      assignedTeam: { id: TEAM_INSTANCE_ID, name: 'Liturgia', description: 'Cuida da liturgia' },
    })

    const detail = await events.getMyCurrentEventTeamDetail(USER_AUTH_ID)

    expect(detail).not.toBeNull()
    expect(detail?.id).toBe(TEAM_INSTANCE_ID)
    expect(detail?.templateKey).toBe(TEAM_KEY)
    expect(detail?.coordinatorSlots).toBe(3)
  })

  it('returns null when the user has no team membership in the current event', async () => {
    const { events } = makeEvents({
      user: { id: USER_ID },
      currentEvent: { id: EVENT_ID },
      assignedTeam: undefined,
    })

    const detail = await events.getMyCurrentEventTeamDetail(USER_AUTH_ID)

    expect(detail).toBeNull()
  })

  it('throws when the user record is not found', async () => {
    const { events } = makeEvents({
      user: undefined,
      currentEvent: { id: EVENT_ID },
    })

    await expect(events.getMyCurrentEventTeamDetail(USER_AUTH_ID)).rejects.toThrow('User not found')
  })

  it('throws when there is no current event', async () => {
    const { events } = makeEvents({
      user: { id: USER_ID },
      currentEvent: undefined,
    })

    await expect(events.getMyCurrentEventTeamDetail(USER_AUTH_ID)).rejects.toThrow(
      'Current event not set'
    )
  })
})

describe('Events.getCurrentEventSubscriptionStatus', () => {
  function makeEvents(opts: {
    subscription?: { id: string; status: string } | undefined
    feePayment?: { status: string } | undefined
    team?: { id: string; name: string } | undefined
    coordinators?: { id: string; name: string; phone: string | null }[]
  }) {
    const userRepository = {
      getUser: vi.fn().mockResolvedValue({ id: USER_ID, authId: USER_AUTH_ID }),
    } as unknown as UserRepository

    const eventRepository = {
      findCurrentEvent: vi.fn().mockResolvedValue({ id: EVENT_ID, name: 'EJC 2026' }),
    } as unknown as EventRepository

    const subscriptionRepository = {
      getSubscriptionByUserAndEvent: vi.fn().mockResolvedValue(opts.subscription),
    } as unknown as SubscriptionRepository

    const subscriptionOptionRepository = {
      listTeamOptionsBySubscription: vi.fn().mockResolvedValue([]),
    } as unknown as SubscriptionOptionRepository

    const teamInstanceRepository = {
      findUserTeamForEvent: vi.fn().mockResolvedValue(opts.team),
    } as unknown as TeamInstanceRepository

    const eventFeePaymentRepository = {
      findPaymentByUserAndEvent: vi.fn().mockResolvedValue(opts.feePayment),
    } as unknown as EventFeePaymentRepository

    const teamMembershipRepository = {
      listTeamCoordinators: vi.fn().mockResolvedValue(opts.coordinators ?? []),
    } as unknown as TeamMembershipRepository

    const events = new Events(
      teamInstanceRepository,
      subscriptionRepository,
      subscriptionOptionRepository,
      userRepository,
      eventRepository,
      teamMembershipRepository,
      {} as CircleRepository,
      eventFeePaymentRepository
    )

    return { events, eventFeePaymentRepository, teamMembershipRepository }
  }

  it('reports no fee status at all for someone who has not subscribed', async () => {
    // Null rather than pending: a person with no place in the event owes nothing.
    const { events } = makeEvents({ subscription: undefined })

    const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(result.eventFeeStatus).toBeNull()
  })

  it('does not look up a payment for someone who has not subscribed', async () => {
    const { events, eventFeePaymentRepository } = makeEvents({ subscription: undefined })

    await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(eventFeePaymentRepository.findPaymentByUserAndEvent).not.toHaveBeenCalled()
  })

  it('reports a pending fee for a subscriber with no payment record yet', async () => {
    const { events } = makeEvents({
      subscription: { id: 'subscription-1', status: 'completed' },
      feePayment: undefined,
    })

    const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(result.eventFeeStatus).toBe('pending')
  })

  it('reports a settled fee once the payment is recorded', async () => {
    const { events } = makeEvents({
      subscription: { id: 'subscription-1', status: 'completed' },
      feePayment: { status: 'paid' },
    })

    const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(result.eventFeeStatus).toBe('paid')
  })

  it('reads a comped fee as settled, since the member owes nothing', async () => {
    const { events } = makeEvents({
      subscription: { id: 'subscription-1', status: 'completed' },
      feePayment: { status: 'exempt' },
    })

    const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(result.eventFeeStatus).toBe('paid')
  })

  it.each(['pending', 'not_paid', 'refunded'])(
    'reads a %s fee as outstanding',
    async (feeStatus) => {
      const { events } = makeEvents({
        subscription: { id: 'subscription-1', status: 'completed' },
        feePayment: { status: feeStatus },
      })

      const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

      expect(result.eventFeeStatus).toBe('pending')
    }
  )

  it('scopes the payment lookup to the current event', async () => {
    // A person who attended a previous event has a fee row there too.
    const { events, eventFeePaymentRepository } = makeEvents({
      subscription: { id: 'subscription-1', status: 'completed' },
    })

    await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(eventFeePaymentRepository.findPaymentByUserAndEvent).toHaveBeenCalledWith(
      USER_ID,
      EVENT_ID
    )
  })

  it('reports a fee status for a subscriber who has not been placed on a team yet', async () => {
    // The fee is owed once per (event, user), so it does not wait on team
    // assignment the way the treasurer's membership-driven list does.
    const { events } = makeEvents({
      subscription: { id: 'subscription-1', status: 'pending' },
    })

    const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(result.assignedTeam).toBeNull()
    expect(result.eventFeeStatus).toBe('pending')
  })

  it('reports no membership type for a subscriber with no team', async () => {
    const { events } = makeEvents({
      subscription: { id: 'subscription-1', status: 'pending' },
    })

    const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(result.myMembershipType).toBeNull()
  })

  it('reports no membership type for someone who has not subscribed', async () => {
    const { events } = makeEvents({ subscription: undefined })

    const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(result.myMembershipType).toBeNull()
  })

  it('reports a coordinator membership when the caller coordinates their team', async () => {
    const { events } = makeEvents({
      subscription: { id: 'subscription-1', status: 'completed' },
      team: { id: TEAM_ID, name: 'Liturgia' },
      coordinators: [{ id: USER_ID, name: 'Ana', phone: null }],
    })

    const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(result.myMembershipType).toBe('coordinator')
  })

  it('reports a plain membership when the caller is on a team they do not coordinate', async () => {
    const { events } = makeEvents({
      subscription: { id: 'subscription-1', status: 'completed' },
      team: { id: TEAM_ID, name: 'Liturgia' },
      coordinators: [{ id: 'other-user', name: 'Ana', phone: null }],
    })

    const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(result.myMembershipType).toBe('member')
  })

  it('reports a plain membership for a team with no coordinator assigned yet', async () => {
    // `every`-style emptiness traps aside: an unstaffed team must not promote
    // its members, so an empty coordinator list reads as `member`.
    const { events } = makeEvents({
      subscription: { id: 'subscription-1', status: 'completed' },
      team: { id: TEAM_ID, name: 'Liturgia' },
      coordinators: [],
    })

    const result = await events.getCurrentEventSubscriptionStatus(USER_AUTH_ID)

    expect(result.myMembershipType).toBe('member')
  })
})
