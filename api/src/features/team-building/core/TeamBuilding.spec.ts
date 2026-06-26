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

function makeRepos(opts: {
  subscriptions: Sub[]
  memberships: Map<string, string[]>
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
  } as unknown as TeamInstanceRepository

  const teamMembershipRepository = {
    listMemberUserIdsByTeamInstanceIds: vi.fn().mockResolvedValue(opts.memberships),
    insertTeamMembership: vi.fn().mockResolvedValue(undefined),
    deleteByMemberAndTeam: vi.fn().mockResolvedValue(undefined),
  } as unknown as TeamMembershipRepository

  return { eventRepository, subscriptionRepository, teamInstanceRepository, teamMembershipRepository }
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
      buildSub({ id: 's1', userId: 'u1', status: 'received', user: { name: 'Alice Ribeiro', nickname: null } as Sub['user'] }),
      buildSub({ id: 's2', userId: 'u2', status: 'received', user: { name: 'Bruno Carvalho', nickname: 'Bru' } as Sub['user'] }),
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
