import { describe, it, expect, vi } from 'vitest'
import { Financial } from './Financial.ts'
import type {
  SetFeePaymentsStatusInput,
  EventFeePaymentRepository,
  MemberFeeStatusRow,
} from '../../../modules/event-fee-payment/domain/EventFeePaymentRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { UserRepository } from '../../../modules/user/domain/UserRepository.ts'
import { AppError, AppErrorCode } from '../../../shared/AppError.ts'

type TeamAggregate = Awaited<
  ReturnType<EventFeePaymentRepository['aggregateFeeStatusByTeam']>
>[number]

function buildTeam(overrides: Partial<TeamAggregate> = {}): TeamAggregate {
  return {
    teamId: 'team-1',
    teamKey: 'acolhida',
    teamName: 'Acolhida',
    total: 7,
    paid: 3,
    ...overrides,
  }
}

function makeFinancial(rows: TeamAggregate[], currentEvent: unknown = { id: 'event-1' }) {
  const eventFeePaymentRepository = {
    aggregateFeeStatusByTeam: vi.fn().mockResolvedValue(rows),
  } as unknown as EventFeePaymentRepository

  const eventRepository = {
    findCurrentEvent: vi.fn().mockResolvedValue(currentEvent),
  } as unknown as EventRepository

  const teamMembershipRepository = {} as unknown as TeamMembershipRepository
  const userRepository = {} as unknown as UserRepository

  return {
    financial: new Financial(
      eventFeePaymentRepository,
      eventRepository,
      teamMembershipRepository,
      userRepository
    ),
    eventFeePaymentRepository,
  }
}

function buildMemberFeeStatusRow(
  overrides: Partial<MemberFeeStatusRow> & Pick<MemberFeeStatusRow, 'userId' | 'name'>
): MemberFeeStatusRow {
  return {
    nickname: null,
    phone: '(11) 91000-4000',
    pictureUrl: null,
    experienceType: 'experienced',
    circleKey: null,
    membershipType: 'member',
    teamId: 'team-1',
    teamKey: 'acolhida',
    teamName: 'Acolhida',
    feeStatus: null,
    ...overrides,
  }
}

function makeMemberListFinancial(
  rows: MemberFeeStatusRow[],
  currentEvent: unknown = { id: 'e-1' }
) {
  const listMemberFeeStatus = vi.fn().mockResolvedValue(rows)

  const eventFeePaymentRepository = {
    listMemberFeeStatus,
  } as unknown as EventFeePaymentRepository

  const eventRepository = {
    findCurrentEvent: vi.fn().mockResolvedValue(currentEvent),
  } as unknown as EventRepository

  return {
    financial: new Financial(
      eventFeePaymentRepository,
      eventRepository,
      {} as unknown as TeamMembershipRepository,
      {} as unknown as UserRepository
    ),
    listMemberFeeStatus,
  }
}

type ConfirmationScenario = {
  /**
   * The membership the *actor* holds in the current event. Present-but-undefined
   * means "holds none", which is why the helper tests for the key rather than
   * falling back with `??`.
   */
  actorMembership?: { id: string; teamInstanceId: string; type: 'member' | 'coordinator' }
  teamMemberIds?: string[]
  teamCoordinatorIds?: string[]
  actor?: unknown
  confirmed?: string[]
}

function makeConfirmationFinancial(scenario: ConfirmationScenario = {}) {
  const event = { id: 'event-1', feeAmountCents: 15000 }

  // Typed rather than a bare `vi.fn()` so the argument assertions below read a
  // real `SetFeePaymentsStatusInput` instead of `any`.
  const setPaymentsStatus = vi.fn<(input: SetFeePaymentsStatusInput) => Promise<string[]>>(
    (input) => Promise.resolve(scenario.confirmed ?? input.userIds)
  )

  const eventFeePaymentRepository = {
    aggregateFeeStatusByTeam: vi.fn(),
    setPaymentsStatus,
  } as unknown as EventFeePaymentRepository

  const eventRepository = {
    findCurrentEvent: vi.fn().mockResolvedValue(event),
  } as unknown as EventRepository

  const teamMembershipRepository = {
    findMembershipByUserAndEvent: vi
      .fn()
      .mockResolvedValue(
        'actorMembership' in scenario
          ? scenario.actorMembership
          : { id: 'm-1', teamInstanceId: 'team-1', type: 'coordinator' }
      ),
    listMemberUserIdsByTeamInstanceIds: vi
      .fn()
      .mockResolvedValue(new Map([['team-1', scenario.teamMemberIds ?? ['user-a', 'user-b']]])),
    getCoordinatorUserIds: vi.fn().mockResolvedValue(scenario.teamCoordinatorIds ?? ['actor-id']),
  } as unknown as TeamMembershipRepository

  const userRepository = {
    getUser: vi.fn().mockResolvedValue('actor' in scenario ? scenario.actor : { id: 'actor-id' }),
  } as unknown as UserRepository

  return {
    financial: new Financial(
      eventFeePaymentRepository,
      eventRepository,
      teamMembershipRepository,
      userRepository
    ),
    setPaymentsStatus,
    teamMembershipRepository,
  }
}

describe('Financial.getCurrentEventOverview', () => {
  it('throws when no event is marked as current', async () => {
    // `null`, not `undefined`: an explicit `undefined` would fall back to the
    // helper's default event and quietly pass.
    const { financial } = makeFinancial([], null)

    await expect(financial.getCurrentEventOverview()).rejects.toThrow('Current event not set')
  })

  it('aggregates against the current event id', async () => {
    const { financial, eventFeePaymentRepository } = makeFinancial([], { id: 'event-42' })

    await financial.getCurrentEventOverview()

    expect(eventFeePaymentRepository.aggregateFeeStatusByTeam).toHaveBeenCalledWith('event-42')
  })

  it('derives pending as everything that is not paid or exempt', async () => {
    const { financial } = makeFinancial([buildTeam({ total: 15, paid: 7 })])

    const overview = await financial.getCurrentEventOverview()

    expect(overview.teams[0].pending).toBe(8)
  })

  it('rounds each team percentage to a whole number', async () => {
    const { financial } = makeFinancial([
      buildTeam({ teamName: 'Cozinha', total: 15, paid: 7 }),
      buildTeam({ teamId: 'team-2', teamName: 'Fotografia', total: 3, paid: 2 }),
    ])

    const overview = await financial.getCurrentEventOverview()

    expect(overview.teams.map((team) => team.paidPercentage)).toEqual([47, 67])
  })

  it('reports a team with no members as zero percent rather than dividing by zero', async () => {
    const { financial } = makeFinancial([buildTeam({ total: 0, paid: 0 })])

    const overview = await financial.getCurrentEventOverview()

    expect(overview.teams[0].paidPercentage).toBe(0)
    expect(overview.teams[0].pending).toBe(0)
  })

  it('sorts teams alphabetically by name', async () => {
    const { financial } = makeFinancial([
      buildTeam({ teamId: 'team-3', teamName: 'Cozinha' }),
      buildTeam({ teamId: 'team-1', teamName: 'Acolhida' }),
      buildTeam({ teamId: 'team-2', teamName: 'Animação' }),
    ])

    const overview = await financial.getCurrentEventOverview()

    expect(overview.teams.map((team) => team.teamName)).toEqual(['Acolhida', 'Animação', 'Cozinha'])
  })

  it('sums the event totals from the team rows', async () => {
    const { financial } = makeFinancial([
      buildTeam({ teamId: 'team-1', teamName: 'Acolhida', total: 7, paid: 3 }),
      buildTeam({ teamId: 'team-2', teamName: 'Cozinha', total: 15, paid: 7 }),
      buildTeam({ teamId: 'team-3', teamName: 'Animação', total: 9, paid: 9 }),
    ])

    const overview = await financial.getCurrentEventOverview()

    expect(overview.totalMembers).toBe(31)
    expect(overview.paidCount).toBe(19)
    expect(overview.pendingCount).toBe(12)
  })

  it('rounds the global percentage', async () => {
    const { financial } = makeFinancial([buildTeam({ total: 119, paid: 88 })])

    const overview = await financial.getCurrentEventOverview()

    expect(overview.paidPercentage).toBe(74)
  })

  it('returns zeroed totals for an event with no teams', async () => {
    const { financial } = makeFinancial([])

    const overview = await financial.getCurrentEventOverview()

    expect(overview).toEqual({
      totalMembers: 0,
      paidCount: 0,
      pendingCount: 0,
      paidPercentage: 0,
      teams: [],
    })
  })
})

describe('Financial.listCurrentEventMemberFees', () => {
  it('throws when no event is marked as current', async () => {
    const { financial } = makeMemberListFinancial([], null)

    await expect(financial.listCurrentEventMemberFees()).rejects.toThrow('Current event not set')
  })

  it('lists against the current event id', async () => {
    const { financial, listMemberFeeStatus } = makeMemberListFinancial([], { id: 'event-42' })

    await financial.listCurrentEventMemberFees()

    expect(listMemberFeeStatus).toHaveBeenCalledWith('event-42')
  })

  it('falls back to the first name when a member has no nickname', async () => {
    const { financial } = makeMemberListFinancial([
      buildMemberFeeStatusRow({ userId: 'u-1', name: 'Maria Silva', nickname: null }),
    ])

    const result = await financial.listCurrentEventMemberFees()

    expect(result.items[0].nickname).toBe('Maria')
  })

  it('prefers the stored nickname when there is one', async () => {
    const { financial } = makeMemberListFinancial([
      buildMemberFeeStatusRow({ userId: 'u-1', name: 'Maria Silva', nickname: 'Mari' }),
    ])

    const result = await financial.listCurrentEventMemberFees()

    expect(result.items[0].nickname).toBe('Mari')
  })

  it.each([
    ['paid', 'paid'],
    // Comped: the member owes nothing, so the list reads them as settled.
    ['exempt', 'paid'],
    ['pending', 'pending'],
    ['not_paid', 'pending'],
    ['refunded', 'pending'],
  ] as const)('reads a stored %s status as %s', async (stored, expected) => {
    const { financial } = makeMemberListFinancial([
      buildMemberFeeStatusRow({ userId: 'u-1', name: 'Maria Silva', feeStatus: stored }),
    ])

    const result = await financial.listCurrentEventMemberFees()

    expect(result.items[0].status).toBe(expected)
  })

  it('reads a member with no payment row as pending', async () => {
    const { financial } = makeMemberListFinancial([
      buildMemberFeeStatusRow({ userId: 'u-1', name: 'Maria Silva', feeStatus: null }),
    ])

    const result = await financial.listCurrentEventMemberFees()

    expect(result.items[0].status).toBe('pending')
  })

  it('reports the filtered total, not the event total', async () => {
    const { financial } = makeMemberListFinancial([
      buildMemberFeeStatusRow({ userId: 'u-1', name: 'Maria Silva', teamKey: 'acolhida' }),
      buildMemberFeeStatusRow({ userId: 'u-2', name: 'João Santos', teamKey: 'cozinha' }),
    ])

    const result = await financial.listCurrentEventMemberFees({ teamKey: 'cozinha' })

    expect(result.total).toBe(1)
    expect(result.items.map((item) => item.userId)).toEqual(['u-2'])
  })

  it('summarises the filtered set, so the cards agree with the table', async () => {
    const { financial } = makeMemberListFinancial([
      buildMemberFeeStatusRow({
        userId: 'u-1',
        name: 'Maria Silva',
        teamKey: 'cozinha',
        feeStatus: 'paid',
      }),
      buildMemberFeeStatusRow({ userId: 'u-2', name: 'João Santos', teamKey: 'cozinha' }),
      // Outside the filter, so it must not move any card.
      buildMemberFeeStatusRow({
        userId: 'u-3',
        name: 'Ana Lima',
        teamKey: 'acolhida',
        feeStatus: 'paid',
      }),
    ])

    const result = await financial.listCurrentEventMemberFees({ teamKey: 'cozinha' })

    expect(result.stats).toEqual({
      totalMembers: 2,
      paidCount: 1,
      pendingCount: 1,
      paidPercentage: 50,
    })
  })

  it('defaults to the first page of twenty', async () => {
    const rows = Array.from({ length: 25 }, (_, index) =>
      buildMemberFeeStatusRow({ userId: `u-${index}`, name: `Member ${index}` })
    )
    const { financial } = makeMemberListFinancial(rows)

    const result = await financial.listCurrentEventMemberFees()

    expect(result.items).toHaveLength(20)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.total).toBe(25)
  })

  it('echoes back the page it served', async () => {
    const rows = Array.from({ length: 25 }, (_, index) =>
      buildMemberFeeStatusRow({ userId: `u-${index}`, name: `Member ${index}` })
    )
    const { financial } = makeMemberListFinancial(rows)

    const result = await financial.listCurrentEventMemberFees({}, { page: 2, pageSize: 20 })

    expect(result.items).toHaveLength(5)
    expect(result.page).toBe(2)
    // The stats still cover every match, not just the five rows on this page.
    expect(result.stats.totalMembers).toBe(25)
  })

  it('returns an empty list for an event with nobody assigned', async () => {
    const { financial } = makeMemberListFinancial([])

    const result = await financial.listCurrentEventMemberFees()

    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      stats: { totalMembers: 0, paidCount: 0, pendingCount: 0, paidPercentage: 0 },
    })
  })
})

describe('Financial.confirmTeamFeesAsCoordinator', () => {
  it('confirms a member of the team the caller coordinates', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial()

    const result = await financial.confirmTeamFeesAsCoordinator('auth|actor', ['user-a'])

    expect(result).toEqual({ updatedUserIds: ['user-a'], updatedCount: 1 })
    expect(setPaymentsStatus).toHaveBeenCalledWith({
      eventId: 'event-1',
      userIds: ['user-a'],
      status: 'paid',
      recordedBy: 'actor-id',
      amountCents: 15000,
    })
  })

  it('always writes paid, since a coordinator cannot choose a status', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial()

    await financial.confirmTeamFeesAsCoordinator('auth|actor', ['user-a'])

    expect(setPaymentsStatus.mock.calls[0][0].status).toBe('paid')
  })

  it('snapshots the event fee onto the confirmation', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial()

    await financial.confirmTeamFeesAsCoordinator('auth|actor', ['user-a'])

    expect(setPaymentsStatus.mock.calls[0][0].amountCents).toBe(15000)
  })

  it('rejects a caller who holds no membership in the current event', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial({
      actorMembership: undefined,
    })

    await expect(financial.confirmTeamFeesAsCoordinator('auth|actor', ['user-a'])).rejects.toThrow(
      'Only a team coordinator can confirm fees for their team'
    )
    expect(setPaymentsStatus).not.toHaveBeenCalled()
  })

  it('rejects a plain member of the team, who coordinates nothing', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial({
      actorMembership: { id: 'm-1', teamInstanceId: 'team-1', type: 'member' },
    })

    await expect(financial.confirmTeamFeesAsCoordinator('auth|actor', ['user-a'])).rejects.toThrow(
      'Only a team coordinator can confirm fees for their team'
    )
    expect(setPaymentsStatus).not.toHaveBeenCalled()
  })

  it('answers a forbidden code so the route can map it to 403 rather than 422', async () => {
    const { financial } = makeConfirmationFinancial({
      actorMembership: { id: 'm-1', teamInstanceId: 'team-1', type: 'member' },
    })

    const error = await financial
      .confirmTeamFeesAsCoordinator('auth|actor', ['user-a'])
      .catch((thrown: AppError) => thrown)

    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).getAppErrorCode()).toBe(AppErrorCode.Forbidden)
  })

  it('refuses to confirm someone outside the coordinated team', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial({
      teamMemberIds: ['user-a'],
    })

    await expect(
      financial.confirmTeamFeesAsCoordinator('auth|actor', ['user-a', 'stranger'])
    ).rejects.toThrow('Cannot confirm a fee for someone outside your team')
    // The whole batch aborts: one outsider must not let the rest through.
    expect(setPaymentsStatus).not.toHaveBeenCalled()
  })

  it('lets a coordinator confirm a fellow coordinator, who owes the fee too', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial({
      teamMemberIds: ['user-a'],
      teamCoordinatorIds: ['actor-id', 'co-coordinator'],
    })

    await financial.confirmTeamFeesAsCoordinator('auth|actor', ['co-coordinator'])

    expect(setPaymentsStatus.mock.calls[0][0].userIds).toEqual(['co-coordinator'])
  })

  it('deduplicates repeated ids before writing', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial()

    await financial.confirmTeamFeesAsCoordinator('auth|actor', ['user-a', 'user-a', 'user-b'])

    expect(setPaymentsStatus.mock.calls[0][0].userIds).toEqual(['user-a', 'user-b'])
  })

  it('reports what the repository actually wrote, not what was requested', async () => {
    const { financial } = makeConfirmationFinancial({ confirmed: ['user-a'] })

    const result = await financial.confirmTeamFeesAsCoordinator('auth|actor', ['user-a', 'user-b'])

    expect(result).toEqual({ updatedUserIds: ['user-a'], updatedCount: 1 })
  })

  it('throws when the caller has no user record', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial({ actor: undefined })

    await expect(financial.confirmTeamFeesAsCoordinator('auth|ghost', ['user-a'])).rejects.toThrow(
      'User not found'
    )
    expect(setPaymentsStatus).not.toHaveBeenCalled()
  })
})

describe('Financial.setFeeStatusAsAdmin', () => {
  it('updates a member of any team without a coordinator check', async () => {
    const { financial, setPaymentsStatus, teamMembershipRepository } = makeConfirmationFinancial()

    const result = await financial.setFeeStatusAsAdmin('auth|admin', ['stranger'], 'paid')

    expect(result).toEqual({ updatedUserIds: ['stranger'], updatedCount: 1 })
    expect(teamMembershipRepository.findMembershipByUserAndEvent).not.toHaveBeenCalled()
    expect(setPaymentsStatus.mock.calls[0][0].userIds).toEqual(['stranger'])
  })

  it.each(['pending', 'not_paid', 'paid', 'exempt'] as const)(
    'passes %s through to the repository',
    async (status) => {
      const { financial, setPaymentsStatus } = makeConfirmationFinancial()

      await financial.setFeeStatusAsAdmin('auth|admin', ['user-a'], status)

      expect(setPaymentsStatus.mock.calls[0][0].status).toBe(status)
    }
  )

  it('comps a member without repricing what they were charged', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial()

    await financial.setFeeStatusAsAdmin('auth|admin', ['user-a'], 'exempt')

    // The amount still travels: it is the snapshot for a row being created, and
    // the repository leaves an existing row's amount alone.
    expect(setPaymentsStatus.mock.calls[0][0].amountCents).toBe(15000)
  })

  it('records the admin as the actor behind the change', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial()

    await financial.setFeeStatusAsAdmin('auth|admin', ['user-a'], 'paid')

    expect(setPaymentsStatus.mock.calls[0][0].recordedBy).toBe('actor-id')
  })

  it('deduplicates repeated ids before writing', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial()

    await financial.setFeeStatusAsAdmin('auth|admin', ['user-a', 'user-a'], 'paid')

    expect(setPaymentsStatus.mock.calls[0][0].userIds).toEqual(['user-a'])
  })

  it('throws when the caller has no user record', async () => {
    const { financial, setPaymentsStatus } = makeConfirmationFinancial({ actor: undefined })

    await expect(financial.setFeeStatusAsAdmin('auth|ghost', ['user-a'], 'paid')).rejects.toThrow(
      'User not found'
    )
    expect(setPaymentsStatus).not.toHaveBeenCalled()
  })
})
