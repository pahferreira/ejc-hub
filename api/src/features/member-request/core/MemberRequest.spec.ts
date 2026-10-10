import { describe, it, expect, vi, beforeEach } from 'vitest'

// runInTransaction is mocked to run the callback with a throwaway tx handle so
// the core logic can be unit-tested without a database.
vi.mock('../../../core/database/client.ts', () => ({
  runInTransaction: (fn: (tx: unknown) => Promise<unknown>) => fn({ tx: true }),
}))

import { MemberRequest } from './MemberRequest.ts'
import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import type {
  MemberRequestRepository,
  MemberRequestRow,
} from '../../../modules/member-request/domain/MemberRequestRepository.ts'

type Sub = Awaited<ReturnType<SubscriptionRepository['listSubscriptionsByEventId']>>[number]

const EVENT_ID = 'event-1'
const TEAM_A = 'team-a'
const TEAM_B = 'team-b'
const ACTOR_AUTH_ID = 'auth0|coord'
const ACTOR_ID = 'coord-1'

// `listTeamCandidates` derives candidates from the event's subscriptions, so
// the fixtures are subscription rows rather than pre-built candidates.
function buildSub(overrides: Partial<Sub> & Pick<Sub, 'id' | 'userId'>): Sub {
  return {
    status: 'received',
    createdAt: new Date('2026-01-01'),
    availability: [],
    details: null,
    teams: [],
    user: {
      name: 'Maria Silva',
      nickname: 'Mari',
      email: 'maria@example.com',
      phone: null,
      instagram: null,
      pictureUrl: null,
      experienceType: 'newbie',
      circle: null,
      hasCoordinatorExperience: false,
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
    },
    ...overrides,
  } as Sub
}

function buildRequestRow(
  overrides: Partial<MemberRequestRow> & Pick<MemberRequestRow, 'id'>
): MemberRequestRow {
  return {
    status: 'pending',
    eventId: EVENT_ID,
    teamInstanceId: TEAM_A,
    user: { userId: 'user-1', name: 'Maria Silva', nickname: 'Mari', pictureUrl: null },
    requestedBy: { userId: ACTOR_ID, name: 'João Santos', nickname: null },
    message: null,
    requestedAt: new Date('2026-01-01'),
    resolvedAt: null,
    resolvedBy: null,
    resolutionReason: null,
    ...overrides,
  }
}

function buildInstance(id: string, name: string, maxCapacity = 15) {
  return {
    id,
    eventId: EVENT_ID,
    templateKey: name.toLowerCase(),
    templateName: name,
    templateDescription: null,
    maxCapacity,
    maxAllowedCoordinators: 3,
  }
}

type Scenario = {
  /** The membership the actor holds in the current event; absent means none. */
  actorMembership?: { id: string; teamInstanceId: string; type: 'member' | 'coordinator' }
  actor?: unknown
  currentEvent?: unknown
  /** The event's subscriptions, from which the eligible candidates are derived. */
  subscriptions?: Sub[]
  teamRequests?: MemberRequestRow[]
  eventRequests?: MemberRequestRow[]
  openRequests?: { id: string; userId: string; teamInstanceId: string }[]
  /** Membership held by each *target* user, keyed by user id. */
  membershipsByUser?: Map<string, { id: string; teamInstanceId: string; type: 'member' }>
  subscriptionsByUser?: Map<string, { id: string; status: string }>
  teamMemberIds?: Map<string, string[]>
  teamCoordinatorIds?: Map<string, string[]>
  request?: MemberRequestRow
  /** Lets the placement write fail, which is how the approve race is simulated. */
  insertTeamMembership?: () => Promise<unknown>
  outdatedRequestIds?: string[]
}

function makeMemberRequest(scenario: Scenario = {}) {
  const eventRepository = {
    findCurrentEvent: vi
      .fn()
      .mockResolvedValue('currentEvent' in scenario ? scenario.currentEvent : { id: EVENT_ID }),
  } as unknown as EventRepository

  const userRepository = {
    getUser: vi
      .fn()
      .mockResolvedValue('actor' in scenario ? scenario.actor : { id: ACTOR_ID, name: 'João' }),
  } as unknown as UserRepository

  const teamMembershipRepository = {
    findMembershipByUserAndEvent: vi.fn((userId: string) => {
      if (userId === ACTOR_ID) {
        return Promise.resolve(
          'actorMembership' in scenario
            ? scenario.actorMembership
            : { id: 'm-1', teamInstanceId: TEAM_A, type: 'coordinator' }
        )
      }

      return Promise.resolve(scenario.membershipsByUser?.get(userId))
    }),
    listMemberUserIdsByTeamInstanceIds: vi
      .fn()
      .mockResolvedValue(scenario.teamMemberIds ?? new Map()),
    listCoordinatorIdsByTeamInstanceIds: vi
      .fn()
      .mockResolvedValue(scenario.teamCoordinatorIds ?? new Map()),
    getCoordinatorUserIds: vi
      .fn()
      .mockImplementation((teamInstanceId: string) =>
        Promise.resolve(scenario.teamCoordinatorIds?.get(teamInstanceId) ?? [])
      ),
    listCoordinatorExperienceByUserIds: vi.fn().mockResolvedValue(new Map()),
    insertTeamMembership: vi.fn(
      scenario.insertTeamMembership ?? (() => Promise.resolve(undefined))
    ),
  } as unknown as TeamMembershipRepository

  const subscriptionRepository = {
    getSubscriptionByUserAndEvent: vi.fn((userId: string) =>
      Promise.resolve(
        scenario.subscriptionsByUser
          ? scenario.subscriptionsByUser.get(userId)
          : { id: `sub-${userId}`, status: 'received' }
      )
    ),
    listSubscriptionsByEventId: vi.fn().mockResolvedValue(scenario.subscriptions ?? []),
    updateSubscriptionStatus: vi.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionRepository

  const teamInstanceRepository = {
    listTeamInstancesWithDetails: vi
      .fn()
      .mockResolvedValue([
        buildInstance(TEAM_A, 'Liturgia'),
        buildInstance(TEAM_B, 'Acolhida', 10),
      ]),
  } as unknown as TeamInstanceRepository

  const memberRequestRepository = {
    insertMemberRequests: vi.fn((inputs: unknown[]) =>
      Promise.resolve(inputs.map((_, index) => `req-${index + 1}`))
    ),
    getMemberRequest: vi.fn().mockResolvedValue(scenario.request),
    listOpenRequestsByTeamAndUsers: vi.fn().mockResolvedValue(scenario.openRequests ?? []),
    listRequestsByTeamInstance: vi.fn().mockResolvedValue(scenario.teamRequests ?? []),
    listRequestsByEvent: vi.fn().mockResolvedValue(scenario.eventRequests ?? []),
    resolveRequests: vi.fn().mockResolvedValue(['req-1']),
    outdateOpenRequestsForUsers: vi.fn().mockResolvedValue(scenario.outdatedRequestIds ?? []),
    cancelOpenRequestsByUserAndEvent: vi.fn().mockResolvedValue([]),
  } as unknown as MemberRequestRepository

  return {
    // Repositories only — no team-building application object. Placement and
    // eligibility come from the shared core helpers, which read these same
    // repositories.
    memberRequest: new MemberRequest(
      memberRequestRepository,
      eventRepository,
      subscriptionRepository,
      teamInstanceRepository,
      teamMembershipRepository,
      userRepository
    ),
    memberRequestRepository,
    teamMembershipRepository,
    subscriptionRepository,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MemberRequest.createRequests', () => {
  it('files one request per person against the team the caller coordinates', async () => {
    const { memberRequest, memberRequestRepository } = makeMemberRequest()

    const result = await memberRequest.createRequests(ACTOR_AUTH_ID, ['u1', 'u2'], 'Precisamos')

    expect(memberRequestRepository.insertMemberRequests).toHaveBeenCalledWith(
      [
        {
          userId: 'u1',
          teamInstanceId: TEAM_A,
          eventId: EVENT_ID,
          requestedBy: ACTOR_ID,
          message: 'Precisamos',
        },
        {
          userId: 'u2',
          teamInstanceId: TEAM_A,
          eventId: EVENT_ID,
          requestedBy: ACTOR_ID,
          message: 'Precisamos',
        },
      ],
      expect.anything()
    )
    expect(result).toEqual({ requestIds: ['req-1', 'req-2'], requestedCount: 2 })
  })

  it('answers 403 when the caller coordinates nothing', async () => {
    const { memberRequest } = makeMemberRequest({ actorMembership: undefined })

    try {
      await memberRequest.createRequests(ACTOR_AUTH_ID, ['u1'])
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as AppError).getAppErrorCode()).toBe(AppErrorCode.Forbidden)
    }
  })

  it('answers 403 when the caller is a plain member of a team', async () => {
    const { memberRequest } = makeMemberRequest({
      actorMembership: { id: 'm-1', teamInstanceId: TEAM_A, type: 'member' },
    })

    await expect(memberRequest.createRequests(ACTOR_AUTH_ID, ['u1'])).rejects.toThrow(
      /Only a team coordinator/
    )
  })

  it('dedupes repeated ids before validating, so a repeat is checked once', async () => {
    const { memberRequest, memberRequestRepository } = makeMemberRequest()

    const result = await memberRequest.createRequests(ACTOR_AUTH_ID, ['u1', 'u1'])

    expect(memberRequestRepository.insertMemberRequests).toHaveBeenCalledWith(
      [expect.objectContaining({ userId: 'u1' })],
      expect.anything()
    )
    expect(result.requestedCount).toBe(1)
  })

  it('aborts the whole batch before writing when one target is already on a team', async () => {
    const { memberRequest, memberRequestRepository } = makeMemberRequest({
      membershipsByUser: new Map([['u2', { id: 'm-9', teamInstanceId: TEAM_B, type: 'member' }]]),
    })

    await expect(memberRequest.createRequests(ACTOR_AUTH_ID, ['u1', 'u2'])).rejects.toThrow(
      /already belongs to a team/
    )
    expect(memberRequestRepository.insertMemberRequests).not.toHaveBeenCalled()
  })

  it('rejects a target whose subscription was cancelled', async () => {
    const { memberRequest, memberRequestRepository } = makeMemberRequest({
      subscriptionsByUser: new Map([['u1', { id: 'sub-1', status: 'cancelled' }]]),
    })

    await expect(memberRequest.createRequests(ACTOR_AUTH_ID, ['u1'])).rejects.toThrow(
      /no active subscription/
    )
    expect(memberRequestRepository.insertMemberRequests).not.toHaveBeenCalled()
  })

  it('rejects a target with no subscription to the event at all', async () => {
    const { memberRequest } = makeMemberRequest({ subscriptionsByUser: new Map() })

    await expect(memberRequest.createRequests(ACTOR_AUTH_ID, ['ghost'])).rejects.toThrow(
      /no active subscription/
    )
  })

  it('rejects a person this team already has an open request for', async () => {
    const { memberRequest, memberRequestRepository } = makeMemberRequest({
      openRequests: [{ id: 'req-old', userId: 'u1', teamInstanceId: TEAM_A }],
    })

    await expect(memberRequest.createRequests(ACTOR_AUTH_ID, ['u1'])).rejects.toThrow(
      /already has an open request from your team/
    )
    expect(memberRequestRepository.insertMemberRequests).not.toHaveBeenCalled()
  })

  it('does not enforce capacity', async () => {
    // Warn-but-allow, matching `addMembers` and `applyAssignments`. A request
    // path stricter than the board would be the odd one out.
    const { memberRequest, memberRequestRepository } = makeMemberRequest({
      teamMemberIds: new Map([[TEAM_A, Array.from({ length: 30 }, (_, i) => `full-${i}`)]]),
    })

    await memberRequest.createRequests(ACTOR_AUTH_ID, ['u1'])

    expect(memberRequestRepository.insertMemberRequests).toHaveBeenCalled()
  })
})

describe('MemberRequest.listRequestableCandidates', () => {
  const subscribers = [
    buildSub({
      id: 's1',
      userId: 'u1',
      user: { name: 'Ana Souza', nickname: 'Ana' } as Sub['user'],
    }),
    buildSub({
      id: 's2',
      userId: 'u2',
      teams: [TEAM_A, 'stale-team'],
      user: { name: 'Bruno Carvalho', nickname: 'Bru' } as Sub['user'],
    }),
  ]

  it('marks a person this team already asked for as requested', async () => {
    const { memberRequest } = makeMemberRequest({
      subscriptions: subscribers,
      teamRequests: [
        buildRequestRow({
          id: 'req-1',
          user: { userId: 'u1', name: 'Ana Souza', nickname: 'Ana', pictureUrl: null },
        }),
      ],
    })

    const result = await memberRequest.listRequestableCandidates(ACTOR_AUTH_ID)
    const byUser = new Map(result.items.map((row) => [row.userId, row.rowStatus]))

    expect(byUser.get('u1')).toBe('requested')
    expect(byUser.get('u2')).toBe('requestable')
  })

  it('never renders an assigned row, because the eligible list excludes placed people', async () => {
    // Decision D2, provisional. Flipping it is `#listEligibleSubscribers` alone.
    const { memberRequest } = makeMemberRequest({ subscriptions: subscribers })

    const result = await memberRequest.listRequestableCandidates(ACTOR_AUTH_ID)

    expect(result.items.every((row) => row.rowStatus !== 'assigned')).toBe(true)
  })

  it('resolves preferences to id/name pairs and drops ids that name no team', async () => {
    const { memberRequest } = makeMemberRequest({ subscriptions: subscribers })

    const result = await memberRequest.listRequestableCandidates(ACTOR_AUTH_ID)
    const bruno = result.items.find((row) => row.userId === 'u2')

    expect(bruno?.preferences).toEqual([{ teamInstanceId: TEAM_A, name: 'Liturgia' }])
  })

  it('counts the cards from the whole team, not the filtered page', async () => {
    // Searching a name must not drop "Vagas na minha equipe" to 1.
    const { memberRequest } = makeMemberRequest({
      subscriptions: subscribers,
      teamMemberIds: new Map([[TEAM_A, ['m1', 'm2', 'm3']]]),
      teamCoordinatorIds: new Map([[TEAM_A, [ACTOR_ID]]]),
      teamRequests: [
        buildRequestRow({ id: 'r1', status: 'pending' }),
        buildRequestRow({
          id: 'r2',
          status: 'pending',
          user: { userId: 'u2', name: 'Bruno', nickname: 'Bru', pictureUrl: null },
        }),
        buildRequestRow({ id: 'r3', status: 'approved' }),
      ],
    })

    const result = await memberRequest.listRequestableCandidates(ACTOR_AUTH_ID, { name: 'Ana' })

    expect(result.total).toBe(1)
    expect(result.stats).toEqual({
      memberCount: 4,
      maxCapacity: 15,
      freeSlots: 11,
      pendingRequests: 2,
      approvedRequests: 1,
      freeSlotsIfAllApproved: 9,
    })
  })

  it('counts a coordinator once even when they also hold a member row', async () => {
    const { memberRequest } = makeMemberRequest({
      subscriptions: subscribers,
      teamMemberIds: new Map([[TEAM_A, ['m1', ACTOR_ID]]]),
      teamCoordinatorIds: new Map([[TEAM_A, [ACTOR_ID]]]),
    })

    const result = await memberRequest.listRequestableCandidates(ACTOR_AUTH_ID)

    expect(result.stats.memberCount).toBe(2)
  })

  it('reports the team the caller coordinates', async () => {
    const { memberRequest } = makeMemberRequest({ subscriptions: subscribers })

    const result = await memberRequest.listRequestableCandidates(ACTOR_AUTH_ID)

    expect(result.team).toEqual({
      id: TEAM_A,
      name: 'Liturgia',
      memberCount: 0,
      maxCapacity: 15,
      freeSlots: 15,
    })
  })

  it('answers 403 for a caller who coordinates nothing', async () => {
    const { memberRequest } = makeMemberRequest({ actorMembership: undefined })

    await expect(memberRequest.listRequestableCandidates(ACTOR_AUTH_ID)).rejects.toThrow(
      /Only a team coordinator/
    )
  })
})

describe('MemberRequest.listMyTeamRequests', () => {
  it("returns the team's requests with the nickname fallback applied", async () => {
    const { memberRequest } = makeMemberRequest({
      teamRequests: [
        buildRequestRow({
          id: 'r1',
          user: { userId: 'u1', name: 'Alice Ribeiro', nickname: null, pictureUrl: null },
        }),
      ],
    })

    const { requests } = await memberRequest.listMyTeamRequests(ACTOR_AUTH_ID)

    expect(requests[0].user.nickname).toBe('Alice')
  })

  it('answers 403 for a non-coordinator', async () => {
    const { memberRequest } = makeMemberRequest({ actorMembership: undefined })

    await expect(memberRequest.listMyTeamRequests(ACTOR_AUTH_ID)).rejects.toThrow(
      /Only a team coordinator/
    )
  })
})

describe('MemberRequest.cancelRequest', () => {
  it("cancels the caller's own pending request, naming them as the resolver", async () => {
    const { memberRequest, memberRequestRepository } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1' }),
    })

    const result = await memberRequest.cancelRequest(ACTOR_AUTH_ID, 'req-1')

    const [cancellation] = vi.mocked(memberRequestRepository.resolveRequests).mock.calls[0]
    expect(cancellation.requestIds).toEqual(['req-1'])
    expect(cancellation.status).toBe('cancelled')
    expect(cancellation.resolvedAt).toBeInstanceOf(Date)
    // A coordinator decided this, unlike the system-written `outdated`.
    expect(cancellation.resolvedBy).toBe(ACTOR_ID)
    expect(result).toEqual({ requestId: 'req-1', status: 'cancelled' })
  })

  it("answers 403 for another team's request, writing nothing", async () => {
    const { memberRequest, memberRequestRepository } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1', teamInstanceId: TEAM_B }),
    })

    try {
      await memberRequest.cancelRequest(ACTOR_AUTH_ID, 'req-1')
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as AppError).getAppErrorCode()).toBe(AppErrorCode.Forbidden)
    }

    expect(memberRequestRepository.resolveRequests).not.toHaveBeenCalled()
  })

  it('refuses to cancel a request that was already answered', async () => {
    const { memberRequest } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1', status: 'approved' }),
    })

    await expect(memberRequest.cancelRequest(ACTOR_AUTH_ID, 'req-1')).rejects.toThrow(
      /Only a pending request can be cancelled/
    )
  })
})

describe('MemberRequest.listCurrentEventRequests', () => {
  const disputed = [
    buildRequestRow({ id: 'r1', teamInstanceId: TEAM_A }),
    buildRequestRow({ id: 'r2', teamInstanceId: TEAM_B }),
    buildRequestRow({
      id: 'r3',
      teamInstanceId: TEAM_A,
      status: 'denied',
      user: { userId: 'u9', name: 'Outro', nickname: 'Outro', pictureUrl: null },
      resolvedBy: { userId: 'admin-1', name: 'Admin Pessoa', nickname: null },
      resolutionReason: 'Sem vaga',
    }),
  ]

  it('pairs each contended request with the rival ones, excluding itself', async () => {
    const { memberRequest } = makeMemberRequest({ eventRequests: disputed })

    const result = await memberRequest.listCurrentEventRequests()
    const first = result.items.find((row) => row.id === 'r1')

    expect(first?.otherPendingRequests).toEqual([
      {
        id: 'r2',
        team: { id: TEAM_B, name: 'Acolhida', freeSlots: 10 },
        requestedBy: { name: 'João Santos', nickname: 'João' },
      },
    ])
  })

  it("carries each team's free slots for the vagas line", async () => {
    const { memberRequest } = makeMemberRequest({
      eventRequests: disputed,
      teamMemberIds: new Map([[TEAM_A, ['m1', 'm2']]]),
    })

    const result = await memberRequest.listCurrentEventRequests()

    expect(result.items.find((row) => row.id === 'r1')?.team.freeSlots).toBe(13)
  })

  it('names the admin who answered, and nobody when the system did', async () => {
    const { memberRequest } = makeMemberRequest({
      eventRequests: [
        ...disputed,
        buildRequestRow({ id: 'r4', status: 'outdated', resolvedBy: null }),
      ],
    })

    const result = await memberRequest.listCurrentEventRequests()
    const byId = new Map(result.items.map((row) => [row.id, row.resolvedBy]))

    expect(byId.get('r3')).toEqual({ name: 'Admin Pessoa', nickname: 'Admin' })
    expect(byId.get('r4')).toBeNull()
  })

  it('computes the stats over the whole event, before filtering', async () => {
    const { memberRequest } = makeMemberRequest({ eventRequests: disputed })

    const result = await memberRequest.listCurrentEventRequests({ status: 'denied' })

    expect(result.stats).toEqual({
      pending: 2,
      disputedMembers: 1,
      disputedRequests: 2,
      approved: 0,
      denied: 1,
    })
    expect(result.total).toBe(1)
    expect(result.items).toHaveLength(1)
  })

  it('filters by the team key rather than the instance id', async () => {
    const { memberRequest } = makeMemberRequest({ eventRequests: disputed })

    const result = await memberRequest.listCurrentEventRequests({ teamKey: 'acolhida' })

    expect(result.items.map((row) => row.id)).toEqual(['r2'])
  })
})

describe('MemberRequest.resolveRequest', () => {
  it('denies with a single write: no membership, no outdating', async () => {
    const { memberRequest, memberRequestRepository, teamMembershipRepository } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1' }),
    })

    const result = await memberRequest.resolveRequest(
      ACTOR_AUTH_ID,
      'req-1',
      'denied',
      'Sem vaga no momento'
    )

    const [denial] = vi.mocked(memberRequestRepository.resolveRequests).mock.calls[0]
    expect(denial.requestIds).toEqual(['req-1'])
    expect(denial.status).toBe('denied')
    expect(denial.resolvedAt).toBeInstanceOf(Date)
    expect(denial.resolvedBy).toBe(ACTOR_ID)
    expect(denial.resolutionReason).toBe('Sem vaga no momento')
    expect(teamMembershipRepository.insertTeamMembership).not.toHaveBeenCalled()
    expect(memberRequestRepository.outdateOpenRequestsForUsers).not.toHaveBeenCalled()
    // A denial answers only this request; the person stays available to
    // every other team.
    expect(result).toEqual({ requestId: 'req-1', status: 'denied', supersededRequestIds: [] })
  })

  it('approves by marking the request first and only then placing the member', async () => {
    // ORDER IS LOAD-BEARING. The placement outdates requests scoped to
    // `status = 'pending'`, so marking this one `approved` first is what keeps
    // an approval from outdating itself.
    const calls: string[] = []
    const { memberRequest, memberRequestRepository, teamMembershipRepository } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1' }),
    })

    vi.mocked(memberRequestRepository.resolveRequests).mockImplementation(() => {
      calls.push('resolveRequests')
      return Promise.resolve(['req-1'])
    })
    vi.mocked(teamMembershipRepository.insertTeamMembership).mockImplementation(() => {
      calls.push('insertTeamMembership')
      return Promise.resolve(undefined)
    })
    vi.mocked(memberRequestRepository.outdateOpenRequestsForUsers).mockImplementation(() => {
      calls.push('outdateOpenRequestsForUsers')
      return Promise.resolve(['req-rival'])
    })

    const result = await memberRequest.resolveRequest(ACTOR_AUTH_ID, 'req-1', 'approved')

    expect(calls).toEqual([
      'resolveRequests',
      'insertTeamMembership',
      'outdateOpenRequestsForUsers',
    ])
    expect(result.status).toBe('approved')
  })

  it('reports the rival requests the placement closed', async () => {
    const { memberRequest } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1' }),
      outdatedRequestIds: ['req-2', 'req-3'],
    })

    const result = await memberRequest.resolveRequest(ACTOR_AUTH_ID, 'req-1', 'approved')

    expect(result).toEqual({
      requestId: 'req-1',
      status: 'approved',
      supersededRequestIds: ['req-2', 'req-3'],
    })
  })

  it('places the member on the requesting team and completes their subscription', async () => {
    const { memberRequest, teamMembershipRepository, subscriptionRepository } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1', teamInstanceId: TEAM_B }),
    })

    await memberRequest.resolveRequest(ACTOR_AUTH_ID, 'req-1', 'approved')

    expect(teamMembershipRepository.insertTeamMembership).toHaveBeenCalledWith(
      { userId: 'user-1', teamInstanceId: TEAM_B, eventId: EVENT_ID, type: 'member' },
      { tx: true }
    )
    expect(subscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
      'sub-user-1',
      'completed',
      { tx: true }
    )
  })

  it("runs the placement on the approval's own transaction, never a second one", async () => {
    // The Phase C composition, seen from this side: `placeMembers` receives the
    // handle `runInTransaction` handed this method, so a failed insert rolls the
    // request\'s own `approved` write back with it.
    const { memberRequest, memberRequestRepository, teamMembershipRepository } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1' }),
    })

    await memberRequest.resolveRequest(ACTOR_AUTH_ID, 'req-1', 'approved')

    const [, insertExecutor] = vi.mocked(teamMembershipRepository.insertTeamMembership).mock
      .calls[0]
    const [, resolveExecutor] = vi.mocked(memberRequestRepository.resolveRequests).mock.calls[0]
    const [, outdateExecutor] = vi.mocked(memberRequestRepository.outdateOpenRequestsForUsers).mock
      .calls[0]

    expect(insertExecutor).toBe(resolveExecutor)
    expect(outdateExecutor).toBe(resolveExecutor)
  })

  it('turns the membership unique violation into MemberAlreadyAssigned', async () => {
    // The race: another team's approval committed between this admin opening
    // the queue and clicking approve. Caught by the constraint, not by a read.
    const violation = Object.assign(new Error('Failed query'), {
      cause: Object.assign(new Error('duplicate key'), {
        code: '23505',
        constraint: 'team_memberships_event_id_user_id_unique',
      }),
    })
    const { memberRequest } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1' }),
      insertTeamMembership: () => Promise.reject(violation),
    })

    try {
      await memberRequest.resolveRequest(ACTOR_AUTH_ID, 'req-1', 'approved')
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as AppError).getAppErrorCode()).toBe(AppErrorCode.MemberAlreadyAssigned)
      expect((error as AppError).getMessage()).toContain('Maria Silva')
    }
  })

  it('lets any other failure through untranslated', async () => {
    const { memberRequest } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1' }),
      insertTeamMembership: () => Promise.reject(new Error('connection reset')),
    })

    await expect(memberRequest.resolveRequest(ACTOR_AUTH_ID, 'req-1', 'approved')).rejects.toThrow(
      'connection reset'
    )
  })

  it('refuses a request that belongs to a previous event, writing nothing', async () => {
    const { memberRequest, memberRequestRepository, teamMembershipRepository } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1', eventId: 'event-old' }),
    })

    await expect(memberRequest.resolveRequest(ACTOR_AUTH_ID, 'req-1', 'approved')).rejects.toThrow(
      /not found in the current event/
    )
    expect(memberRequestRepository.resolveRequests).not.toHaveBeenCalled()
    expect(teamMembershipRepository.insertTeamMembership).not.toHaveBeenCalled()
  })

  it('refuses a request that was already answered', async () => {
    const { memberRequest } = makeMemberRequest({
      request: buildRequestRow({ id: 'req-1', status: 'approved' }),
    })

    await expect(memberRequest.resolveRequest(ACTOR_AUTH_ID, 'req-1', 'denied')).rejects.toThrow(
      /Only a pending request can be approved or denied/
    )
  })
})

describe('MemberRequest with no current event', () => {
  it('refuses every entry point rather than acting on a previous event', async () => {
    const { memberRequest } = makeMemberRequest({ currentEvent: undefined })

    await expect(memberRequest.createRequests(ACTOR_AUTH_ID, ['u1'])).rejects.toThrow(
      /Current event not set/
    )
    await expect(memberRequest.listCurrentEventRequests()).rejects.toThrow(/Current event not set/)
  })
})
