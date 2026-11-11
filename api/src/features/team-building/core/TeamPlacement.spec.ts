import { describe, it, expect, vi } from 'vitest'

// runInTransaction is mocked to run the callback with a recognisable tx handle so
// the placement can be unit-tested without a database.
vi.mock('../../../core/database/client.ts', () => ({
  runInTransaction: (fn: (tx: unknown) => Promise<unknown>) => fn({ own: true }),
}))

import { TeamPlacement } from './TeamPlacement.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { MemberRequestRepository } from '../../../modules/member-request/domain/MemberRequestRepository.ts'

const EVENT_ID = 'event-1'
const TEAM_A = 'team-a'
const TEAM_B = 'team-b'

type Sub = Awaited<ReturnType<SubscriptionRepository['listSubscriptionsByEventId']>>[number]

function buildSub(overrides: Partial<Sub> & Pick<Sub, 'id' | 'userId'>): Sub {
  return {
    status: 'received',
    createdAt: new Date(),
    teams: [],
    user: {
      name: 'Member',
      nickname: null,
      email: 'm@e.com',
      phone: null,
      pictureUrl: null,
      experienceType: 'newbie',
      hasCoordinatorExperience: false,
    },
    ...overrides,
  } as Sub
}

function buildInstance(id: string, name: string) {
  return {
    id,
    eventId: EVENT_ID,
    templateKey: name.toLowerCase(),
    templateName: name,
    templateDescription: null,
    maxCapacity: 10,
    maxAllowedCoordinators: 3,
  }
}

function makePlacement(opts: {
  subscriptions?: Sub[]
  /** Members per team instance. */
  memberships?: Map<string, string[]>
  /** Coordinators per team instance. */
  coordinators?: Map<string, string[]>
  coordinatorExperience?: Map<string, string[]>
  outdatedRequestIds?: string[]
}) {
  const subscriptions = opts.subscriptions ?? []

  const teamInstanceRepository = {
    listTeamInstancesWithDetails: vi
      .fn()
      .mockResolvedValue([buildInstance(TEAM_A, 'Liturgia'), buildInstance(TEAM_B, 'Música')]),
  } as unknown as TeamInstanceRepository

  const teamMembershipRepository = {
    listMemberUserIdsByTeamInstanceIds: vi.fn().mockResolvedValue(opts.memberships ?? new Map()),
    listCoordinatorIdsByTeamInstanceIds: vi.fn().mockResolvedValue(opts.coordinators ?? new Map()),
    listCoordinatorExperienceByUserIds: vi
      .fn()
      .mockResolvedValue(opts.coordinatorExperience ?? new Map()),
    getCoordinatorUserIds: vi.fn((teamInstanceId: string) =>
      Promise.resolve(opts.coordinators?.get(teamInstanceId) ?? [])
    ),
    insertTeamMembership: vi.fn().mockResolvedValue(undefined),
  } as unknown as TeamMembershipRepository

  const subscriptionRepository = {
    listSubscriptionsByEventId: vi.fn().mockResolvedValue(subscriptions),
    getSubscriptionByUserAndEvent: vi.fn((userId: string) =>
      Promise.resolve(subscriptions.find((sub) => sub.userId === userId))
    ),
    updateSubscriptionStatus: vi.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionRepository

  const memberRequestRepository = {
    outdateOpenRequestsForUsers: vi.fn().mockResolvedValue(opts.outdatedRequestIds ?? []),
  } as unknown as MemberRequestRepository

  return {
    placement: new TeamPlacement(
      teamInstanceRepository,
      teamMembershipRepository,
      subscriptionRepository,
      memberRequestRepository
    ),
    teamMembershipRepository,
    subscriptionRepository,
    memberRequestRepository,
  }
}

describe('TeamPlacement.listCandidates', () => {
  it('excludes members of any team, coordinators of other teams and cancelled subscriptions', async () => {
    const { placement } = makePlacement({
      subscriptions: [
        buildSub({ id: 's1', userId: 'free' }),
        buildSub({ id: 's2', userId: 'member-b' }),
        buildSub({ id: 's3', userId: 'coord-b' }),
        buildSub({ id: 's4', userId: 'gone', status: 'cancelled' }),
      ],
      memberships: new Map([[TEAM_B, ['member-b']]]),
      coordinators: new Map([[TEAM_B, ['coord-b']]]),
    })

    const result = await placement.listCandidates({
      eventId: EVENT_ID,
      teamInstanceId: TEAM_A,
      role: 'member',
    })

    expect(result.candidates.map((c) => c.userId)).toEqual(['free'])
  })
})

describe('TeamPlacement.listCandidates by role', () => {
  const scenario = () =>
    makePlacement({
      subscriptions: [
        buildSub({ id: 's1', userId: 'coord-a' }),
        buildSub({ id: 's2', userId: 'free' }),
      ],
      coordinators: new Map([[TEAM_A, ['coord-a']]]),
    })

  it("keeps the target team's own coordinators when listing coordinators", async () => {
    const result = await scenario().placement.listCandidates({
      eventId: EVENT_ID,
      teamInstanceId: TEAM_A,
      role: 'coordinator',
    })

    expect(result.candidates.map((c) => c.userId).sort()).toEqual(['coord-a', 'free'])
    expect(result.currentCoordinators).toEqual(['coord-a'])
  })

  it("leaves the target team's own coordinators out when listing members", async () => {
    const result = await scenario().placement.listCandidates({
      eventId: EVENT_ID,
      teamInstanceId: TEAM_A,
      role: 'member',
    })

    expect(result.candidates.map((c) => c.userId)).toEqual(['free'])
  })

  it('rejects a team instance outside the event', async () => {
    await expect(
      scenario().placement.listCandidates({
        eventId: EVENT_ID,
        teamInstanceId: 'elsewhere',
        role: 'member',
      })
    ).rejects.toThrow('does not belong to the current event')
  })
})

describe('TeamPlacement.place', () => {
  it('inserts a membership, completes the subscription and returns the outdated request ids', async () => {
    const { placement, teamMembershipRepository, subscriptionRepository, memberRequestRepository } =
      makePlacement({
        subscriptions: [buildSub({ id: 's1', userId: 'u1', status: 'waiting_list' })],
        outdatedRequestIds: ['req-9'],
      })

    const outdated = await placement.place({
      eventId: EVENT_ID,
      teamInstanceId: TEAM_A,
      userIds: ['u1', 'u1'],
    })

    expect(outdated).toEqual(['req-9'])
    expect(teamMembershipRepository.insertTeamMembership).toHaveBeenCalledTimes(1)
    expect(teamMembershipRepository.insertTeamMembership).toHaveBeenCalledWith(
      { userId: 'u1', teamInstanceId: TEAM_A, eventId: EVENT_ID, type: 'member' },
      { own: true }
    )
    expect(subscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
      's1',
      'completed',
      { own: true }
    )
    expect(memberRequestRepository.outdateOpenRequestsForUsers).toHaveBeenCalledWith(
      { eventId: EVENT_ID, userIds: ['u1'] },
      { own: true }
    )
  })
})

describe('TeamPlacement.place rejections', () => {
  const placeOn = (
    opts: Parameters<typeof makePlacement>[0],
    userIds: string[],
    teamInstanceId = TEAM_A
  ) => {
    const scenario = makePlacement(opts)
    return {
      ...scenario,
      result: scenario.placement.place({ eventId: EVENT_ID, teamInstanceId, userIds }),
    }
  }

  it('rejects the whole batch when one user is already on a team, before writing', async () => {
    const { result, teamMembershipRepository } = placeOn(
      {
        subscriptions: [buildSub({ id: 's1', userId: 'u1' }), buildSub({ id: 's2', userId: 'u2' })],
        memberships: new Map([[TEAM_B, ['u2']]]),
      },
      ['u1', 'u2']
    )

    await expect(result).rejects.toThrow('User u2 is already assigned to a team')
    expect(teamMembershipRepository.insertTeamMembership).not.toHaveBeenCalled()
  })

  it('rejects a user who coordinates a team in the event', async () => {
    const { result } = placeOn(
      {
        subscriptions: [buildSub({ id: 's1', userId: 'coord-b' })],
        coordinators: new Map([[TEAM_B, ['coord-b']]]),
      },
      ['coord-b']
    )

    await expect(result).rejects.toThrow('User coord-b already coordinates a team in this event')
  })

  it('rejects a user without a subscription in the event', async () => {
    const { result } = placeOn({}, ['ghost'])

    await expect(result).rejects.toThrow('No subscription found for user ghost')
  })

  it('rejects an empty batch', async () => {
    const { result } = placeOn({}, [])

    await expect(result).rejects.toThrow('At least one member is required')
  })

  it('rejects a team instance outside the event', async () => {
    const { result } = placeOn(
      { subscriptions: [buildSub({ id: 's1', userId: 'u1' })] },
      ['u1'],
      'elsewhere'
    )

    await expect(result).rejects.toThrow('does not belong to the current event')
  })
})

describe('TeamPlacement.place with a caller transaction', () => {
  it("writes on the caller's executor instead of opening its own", async () => {
    const { placement, teamMembershipRepository, memberRequestRepository } = makePlacement({
      subscriptions: [buildSub({ id: 's1', userId: 'u1' })],
    })
    const callerTx = { caller: true } as never

    await placement.place({
      eventId: EVENT_ID,
      teamInstanceId: TEAM_A,
      userIds: ['u1'],
      executor: callerTx,
    })

    const [, insertExecutor] = vi.mocked(teamMembershipRepository.insertTeamMembership).mock
      .calls[0]
    const [, outdateExecutor] = vi.mocked(memberRequestRepository.outdateOpenRequestsForUsers).mock
      .calls[0]
    expect(insertExecutor).toBe(callerTx)
    expect(outdateExecutor).toBe(callerTx)
  })
})
