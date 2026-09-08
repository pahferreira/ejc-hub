import { describe, it, expect, vi } from 'vitest'
import { Financial } from './Financial.ts'
import type { EventFeePaymentRepository } from '../../../modules/event-fee-payment/domain/EventFeePaymentRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'

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

  return {
    financial: new Financial(eventFeePaymentRepository, eventRepository),
    eventFeePaymentRepository,
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
