import { describe, it, expect, vi, beforeEach } from 'vitest'

// runInTransaction is mocked to run the callback with a throwaway tx handle so
// the core logic can be unit-tested without a database.
vi.mock('../../../core/database/client.ts', () => ({
  runInTransaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
}))

import { TeamBuilding } from './TeamBuilding.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { SubscriptionRepository } from '../../../modules/subscription/domain/SubscriptionRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'

const EVENT_ID = 'event-1'
const TEAM_A = 'team-a'
const TEAM_B = 'team-b'

const noSkills = {
  hasActingSkills: false,
  hasCommunicationSkills: false,
  hasCookingSkills: false,
  hasDancingSkills: false,
  hasManualSkills: false,
  hasMusicSkills: false,
  hasSingingSkills: false,
}

type Sub = Awaited<ReturnType<SubscriptionRepository['listSubscriptionsByEventId']>>[number]

function buildSub(overrides: Partial<Sub> & Pick<Sub, 'id' | 'userId' | 'status'>): Sub {
  return {
    createdAt: new Date(),
    teams: [],
    user: {
      name: 'Member',
      nickname: null,
      email: 'm@e.com',
      phone: null,
      experienceType: 'newbie',
      ...noSkills,
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
  }
}

type CoordinatorSlots = { first: string | null; second: string | null; third: string | null }

function makeRepos(opts: {
  subscriptions: Sub[]
  memberships: Map<string, string[]>
  coordinators?: Map<string, string[]>
  coordinatorSlots?: CoordinatorSlots
}) {
  const eventRepository = {
    findCurrentEvent: vi.fn().mockResolvedValue({ id: EVENT_ID }),
  } as unknown as EventRepository

  const subscriptionRepository = {
    listSubscriptionsByEventId: vi.fn().mockResolvedValue(opts.subscriptions),
    getSubscriptionByUserAndEvent: vi.fn((userId: string) =>
      Promise.resolve(opts.subscriptions.find((sub) => sub.userId === userId))
    ),
    updateSubscriptionStatus: vi.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionRepository

  const teamInstanceRepository = {
    listTeamInstancesWithDetails: vi
      .fn()
      .mockResolvedValue([buildInstance(TEAM_A, 'Liturgia'), buildInstance(TEAM_B, 'Música')]),
    listCoordinatorIdsByTeamInstanceIds: vi.fn().mockResolvedValue(opts.coordinators ?? new Map()),
    getCoordinatorSlots: vi
      .fn()
      .mockResolvedValue(opts.coordinatorSlots ?? { first: null, second: null, third: null }),
    setCoordinators: vi.fn().mockResolvedValue(undefined),
  } as unknown as TeamInstanceRepository

  const teamMembershipRepository = {
    listMemberUserIdsByTeamInstanceIds: vi.fn().mockResolvedValue(opts.memberships),
    insertTeamMembership: vi.fn().mockResolvedValue(undefined),
    deleteByMemberAndTeam: vi.fn().mockResolvedValue(undefined),
  } as unknown as TeamMembershipRepository

  return {
    eventRepository,
    subscriptionRepository,
    teamInstanceRepository,
    teamMembershipRepository,
  }
}

describe('TeamBuilding.getCurrentEventBoard', () => {
  it('buckets members into unassigned, waiting list, and team columns by the rules', async () => {
    const subscriptions = [
      buildSub({ id: 's1', userId: 'u1', status: 'received' }), // no membership -> Sem Equipe
      buildSub({ id: 's2', userId: 'u2', status: 'waiting_list' }), // -> Lista de Espera
      buildSub({ id: 's3', userId: 'u3', status: 'completed' }), // membership in TEAM_A -> team column
      buildSub({ id: 's4', userId: 'u4', status: 'pending' }), // no membership, not received -> excluded
    ]
    const memberships = new Map<string, string[]>([[TEAM_A, ['u3']]])

    const repos = makeRepos({ subscriptions, memberships })
    const teamBuilding = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    const { columns } = await teamBuilding.getCurrentEventBoard()

    const byId = new Map(columns.map((column) => [column.id, column]))
    expect(byId.get('unassigned')?.members.map((m) => m.userId)).toEqual(['u1'])
    expect(byId.get('waiting_list')?.members.map((m) => m.userId)).toEqual(['u2'])
    expect(byId.get(TEAM_A)?.members.map((m) => m.userId)).toEqual(['u3'])
    expect(byId.get(TEAM_A)?.max).toBe(10)
    expect(byId.get(TEAM_B)?.members).toEqual([])
  })

  it('resolves preference names from the event team instances', async () => {
    const subscriptions = [
      buildSub({ id: 's1', userId: 'u1', status: 'received', teams: [TEAM_B, 'stale-id'] }),
    ]
    const repos = makeRepos({ subscriptions, memberships: new Map() })
    const teamBuilding = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    const { columns } = await teamBuilding.getCurrentEventBoard()
    const member = columns.find((column) => column.id === 'unassigned')?.members[0]

    expect(member?.preferences).toEqual(['Música'])
  })

  it('falls back to the first name when the user has no nickname', async () => {
    const subscriptions = [
      buildSub({
        id: 's1',
        userId: 'u1',
        status: 'received',
        user: { name: 'Alice Ribeiro', nickname: null } as Sub['user'],
      }),
      buildSub({
        id: 's2',
        userId: 'u2',
        status: 'received',
        user: { name: 'Bruno Carvalho', nickname: 'Bru' } as Sub['user'],
      }),
    ]
    const repos = makeRepos({ subscriptions, memberships: new Map() })
    const teamBuilding = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    const { columns } = await teamBuilding.getCurrentEventBoard()
    const members = columns.find((column) => column.id === 'unassigned')?.members ?? []
    const nicknameByUser = new Map(members.map((member) => [member.userId, member.nickname]))

    expect(nicknameByUser.get('u1')).toBe('Alice')
    expect(nicknameByUser.get('u2')).toBe('Bru')
  })
})

describe('TeamBuilding.applyAssignments', () => {
  let repos: ReturnType<typeof makeRepos>
  let teamBuilding: TeamBuilding

  beforeEach(() => {
    const subscriptions = [
      buildSub({ id: 's1', userId: 'u1', status: 'waiting_list' }),
      buildSub({ id: 's2', userId: 'u2', status: 'received' }),
    ]
    // u2 currently sits in TEAM_A.
    repos = makeRepos({ subscriptions, memberships: new Map([[TEAM_A, ['u2']]]) })
    teamBuilding = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )
  })

  it('assigns a waiting-list member to a team and promotes their status', async () => {
    await teamBuilding.applyAssignments([
      { userId: 'u1', target: { kind: 'team', teamInstanceId: TEAM_B } },
    ])

    expect(repos.teamMembershipRepository.insertTeamMembership).toHaveBeenCalledWith(
      { userId: 'u1', teamInstanceId: TEAM_B },
      expect.anything()
    )
    expect(repos.subscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
      's1',
      'received',
      expect.anything()
    )
  })

  it('returns a member to the waiting list, removing their team membership', async () => {
    await teamBuilding.applyAssignments([{ userId: 'u2', target: { kind: 'waiting_list' } }])

    expect(repos.teamMembershipRepository.deleteByMemberAndTeam).toHaveBeenCalledWith(
      TEAM_A,
      'u2',
      expect.anything()
    )
    expect(repos.subscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
      's2',
      'waiting_list',
      expect.anything()
    )
  })

  it('rejects a team target that does not belong to the current event', async () => {
    await expect(
      teamBuilding.applyAssignments([
        { userId: 'u1', target: { kind: 'team', teamInstanceId: 'foreign-team' } },
      ])
    ).rejects.toThrow(/does not belong to the current event/)

    expect(repos.teamMembershipRepository.insertTeamMembership).not.toHaveBeenCalled()
  })
})

describe('TeamBuilding.listCandidates', () => {
  it('excludes members of any team and coordinators of other teams', async () => {
    const subscriptions = [
      buildSub({ id: 's1', userId: 'u1', status: 'received' }), // no membership, no coord → include
      buildSub({ id: 's2', userId: 'u2', status: 'received' }), // member of TEAM_A → exclude
      buildSub({ id: 's3', userId: 'u3', status: 'received' }), // coordinator of TEAM_B → exclude
      buildSub({ id: 's4', userId: 'u4', status: 'received' }), // coordinator of TEAM_A (target) → force-include
    ]
    // u2 is a member of TEAM_A (the target), u4 is a coordinator of TEAM_A (target)
    const memberships = new Map([[TEAM_A, ['u2']]])
    const coordinators = new Map([
      [TEAM_A, ['u4']], // own coordinator → force-include
      [TEAM_B, ['u3']], // other team coordinator → exclude
    ])

    const repos = makeRepos({ subscriptions, memberships, coordinators })
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    const result = await tb.listCandidates(TEAM_A)

    const candidateIds = result.candidates.map((c) => c.userId)
    expect(candidateIds).toContain('u1')
    expect(candidateIds).toContain('u4') // force-included own coordinator
    expect(candidateIds).not.toContain('u2') // member of a team
    expect(candidateIds).not.toContain('u3') // coordinator of another team
  })

  it('resolves preference names from event team instances', async () => {
    const subscriptions = [
      buildSub({ id: 's1', userId: 'u1', status: 'received', teams: [TEAM_B, 'stale-id'] }),
    ]
    const repos = makeRepos({ subscriptions, memberships: new Map() })
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    const result = await tb.listCandidates(TEAM_A)

    const candidate = result.candidates.find((c) => c.userId === 'u1')
    expect(candidate?.preferenceTeamIds).toEqual([TEAM_B, 'stale-id'])
    expect(candidate?.preferences).toEqual(['Música']) // 'stale-id' has no matching instance
  })

  it('rejects a teamInstanceId that does not belong to the current event', async () => {
    const repos = makeRepos({ subscriptions: [], memberships: new Map() })
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    await expect(tb.listCandidates('foreign-team')).rejects.toThrow(
      /does not belong to the current event/
    )
  })

  it('returns currentCoordinators positionally with nulls preserved', async () => {
    const subscriptions = [buildSub({ id: 's1', userId: 'u1', status: 'received' })]
    const slots = { first: 'coord-1', second: null, third: 'coord-3' }
    const repos = makeRepos({ subscriptions, memberships: new Map(), coordinatorSlots: slots })
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    const result = await tb.listCandidates(TEAM_A)

    expect(result.currentCoordinators).toEqual({ first: 'coord-1', second: null, third: 'coord-3' })
  })

  it('returns team name in the result', async () => {
    const repos = makeRepos({ subscriptions: [], memberships: new Map() })
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    const result = await tb.listCandidates(TEAM_A)

    expect(result.team).toEqual({ id: TEAM_A, name: 'Liturgia' })
  })
})

describe('TeamBuilding.assignCoordinators', () => {
  function makeAssignRepos(subscriptions: Sub[]) {
    return makeRepos({ subscriptions, memberships: new Map() })
  }

  it('writes coordinator IDs positionally and nulls unfilled slots', async () => {
    const subscriptions = [
      buildSub({ id: 's1', userId: 'u1', status: 'received' }),
      buildSub({ id: 's2', userId: 'u2', status: 'received' }),
    ]
    const repos = makeAssignRepos(subscriptions)
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    await tb.assignCoordinators(TEAM_A, ['u1', 'u2'])

    expect(repos.teamInstanceRepository.setCoordinators).toHaveBeenCalledWith(TEAM_A, {
      first: 'u1',
      second: 'u2',
      third: null,
    })
  })

  it('nulls all slots when given an empty array (clear all)', async () => {
    const repos = makeAssignRepos([])
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    await tb.assignCoordinators(TEAM_A, [])

    expect(repos.teamInstanceRepository.setCoordinators).toHaveBeenCalledWith(TEAM_A, {
      first: null,
      second: null,
      third: null,
    })
  })

  it('rejects more than 3 unique coordinator IDs', async () => {
    const subscriptions = [
      buildSub({ id: 's1', userId: 'u1', status: 'received' }),
      buildSub({ id: 's2', userId: 'u2', status: 'received' }),
      buildSub({ id: 's3', userId: 'u3', status: 'received' }),
      buildSub({ id: 's4', userId: 'u4', status: 'received' }),
    ]
    const repos = makeAssignRepos(subscriptions)
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    await expect(tb.assignCoordinators(TEAM_A, ['u1', 'u2', 'u3', 'u4'])).rejects.toThrow(
      /at most 3 coordinators/
    )
    expect(repos.teamInstanceRepository.setCoordinators).not.toHaveBeenCalled()
  })

  it('dedupes before enforcing the max-3 limit (4 identical IDs → 1 unique → passes)', async () => {
    const subscriptions = [buildSub({ id: 's1', userId: 'u1', status: 'received' })]
    const repos = makeAssignRepos(subscriptions)
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    // 4 entries but all the same userId — should dedupe to 1 and pass validation
    await expect(tb.assignCoordinators(TEAM_A, ['u1', 'u1', 'u1', 'u1'])).resolves.toBeUndefined()

    expect(repos.teamInstanceRepository.setCoordinators).toHaveBeenCalledWith(TEAM_A, {
      first: 'u1',
      second: null,
      third: null,
    })
  })

  it('rejects a userId that has no subscription in the current event', async () => {
    const repos = makeAssignRepos([]) // no subscriptions
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    await expect(tb.assignCoordinators(TEAM_A, ['unknown-user'])).rejects.toThrow(
      /No subscription found for user/
    )
    expect(repos.teamInstanceRepository.setCoordinators).not.toHaveBeenCalled()
  })

  it('rejects a teamInstanceId that does not belong to the current event', async () => {
    const repos = makeAssignRepos([])
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    await expect(tb.assignCoordinators('foreign-team', [])).rejects.toThrow(
      /does not belong to the current event/
    )
    expect(repos.teamInstanceRepository.setCoordinators).not.toHaveBeenCalled()
  })
})

// Regression: the listTeamCoordinators fix adds the third coordinator slot.
// Within the unit harness we verify that listCandidates correctly reads the
// third slot position from getCoordinatorSlots (the positional read method),
// and that force-include works for a third-slot coordinator.
describe('Regression: third coordinator slot', () => {
  it('force-includes a third-slot coordinator in the candidate list', async () => {
    const subscriptions = [
      buildSub({ id: 's1', userId: 'coord-3', status: 'received' }), // third coordinator of target
    ]
    // coord-3 is the third coordinator of TEAM_A
    const coordinators = new Map([[TEAM_A, ['coord-1', 'coord-2', 'coord-3']]])
    const slots = { first: 'coord-1', second: 'coord-2', third: 'coord-3' }

    const repos = makeRepos({
      subscriptions,
      memberships: new Map(),
      coordinators,
      coordinatorSlots: slots,
    })
    const tb = new TeamBuilding(
      repos.teamInstanceRepository,
      repos.teamMembershipRepository,
      repos.subscriptionRepository,
      repos.eventRepository
    )

    const result = await tb.listCandidates(TEAM_A)

    expect(result.candidates.map((c) => c.userId)).toContain('coord-3')
    expect(result.currentCoordinators.third).toBe('coord-3')
  })
})
