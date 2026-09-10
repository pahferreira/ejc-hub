import { describe, it, expect } from 'vitest'
import { filterMemberFees, paginateMemberFees, summarizeMemberFees } from './member-fee-list.ts'
import type { EventFeeMemberRow } from '../domain/event-fee.types.ts'

function buildMember(overrides: Partial<EventFeeMemberRow> = {}): EventFeeMemberRow {
  return {
    userId: 'user-1',
    name: 'Maria Silva',
    nickname: 'Mari',
    phone: '(11) 91000-4000',
    pictureUrl: null,
    experienceType: 'experienced',
    circleKey: null,
    membershipType: 'member',
    teamId: 'team-1',
    teamKey: 'acolhida',
    teamName: 'Acolhida',
    status: 'pending',
    ...overrides,
  }
}

describe('filterMemberFees', () => {
  it('returns every member when no filter is given', () => {
    const rows = [buildMember(), buildMember({ userId: 'user-2' })]

    expect(filterMemberFees(rows)).toHaveLength(2)
  })

  it('matches part of the full name, case-insensitively', () => {
    const rows = [
      buildMember({ name: 'Maria Silva' }),
      buildMember({ userId: 'u2', name: 'João Santos', nickname: 'Joca' }),
    ]

    expect(filterMemberFees(rows, { name: 'SANTOS' }).map((row) => row.name)).toEqual([
      'João Santos',
    ])
  })

  it('matches the nickname as well as the full name', () => {
    const rows = [
      buildMember({ name: 'Maria Silva', nickname: 'Mari' }),
      buildMember({ userId: 'u2', name: 'João Santos', nickname: 'Joca' }),
    ]

    expect(filterMemberFees(rows, { name: 'joca' }).map((row) => row.name)).toEqual(['João Santos'])
  })

  it('ignores accents, so an unaccented query still finds an accented name', () => {
    const rows = [buildMember({ userId: 'u2', name: 'Júlia Barbosa', nickname: 'Ju' })]

    expect(filterMemberFees(rows, { name: 'julia' })).toHaveLength(1)
  })

  it('finds nobody when the name matches no member', () => {
    const rows = [buildMember({ name: 'Maria Silva' })]

    expect(filterMemberFees(rows, { name: 'Roberto' })).toEqual([])
  })

  it('keeps only the requested team', () => {
    const rows = [
      buildMember({ teamKey: 'acolhida' }),
      buildMember({ userId: 'u2', teamKey: 'cozinha' }),
    ]

    expect(filterMemberFees(rows, { teamKey: 'cozinha' }).map((row) => row.userId)).toEqual(['u2'])
  })

  it('returns nothing for a team with no members rather than throwing', () => {
    expect(filterMemberFees([buildMember()], { teamKey: 'unknown-team' })).toEqual([])
  })

  it('keeps only the requested status', () => {
    const rows = [buildMember({ status: 'paid' }), buildMember({ userId: 'u2', status: 'pending' })]

    expect(filterMemberFees(rows, { status: 'pending' }).map((row) => row.userId)).toEqual(['u2'])
  })

  it('composes the filters with AND', () => {
    const rows = [
      buildMember({ userId: 'u1', name: 'Maria Silva', teamKey: 'acolhida', status: 'paid' }),
      buildMember({ userId: 'u2', name: 'Maria Souza', teamKey: 'cozinha', status: 'paid' }),
      buildMember({ userId: 'u3', name: 'Maria Souza', teamKey: 'cozinha', status: 'pending' }),
    ]

    const filtered = filterMemberFees(rows, {
      name: 'maria',
      teamKey: 'cozinha',
      status: 'paid',
    })

    expect(filtered.map((row) => row.userId)).toEqual(['u2'])
  })

  it('does not mutate the rows it was given', () => {
    const rows = [buildMember(), buildMember({ userId: 'u2', status: 'paid' })]

    filterMemberFees(rows, { status: 'paid' })

    expect(rows).toHaveLength(2)
  })
})

describe('summarizeMemberFees', () => {
  it('counts paid and pending separately', () => {
    const rows = [
      buildMember({ userId: 'u1', status: 'paid' }),
      buildMember({ userId: 'u2', status: 'paid' }),
      buildMember({ userId: 'u3', status: 'pending' }),
    ]

    expect(summarizeMemberFees(rows)).toEqual({
      totalMembers: 3,
      paidCount: 2,
      pendingCount: 1,
      paidPercentage: 67,
    })
  })

  it('matches the design mock: 75 of 119 paid reads as 63%', () => {
    const rows = Array.from({ length: 119 }, (_, index) =>
      buildMember({ userId: `u${index}`, status: index < 75 ? 'paid' : 'pending' })
    )

    const stats = summarizeMemberFees(rows)

    expect(stats).toEqual({
      totalMembers: 119,
      paidCount: 75,
      pendingCount: 44,
      paidPercentage: 63,
    })
  })

  it('reports zero percent for an empty list instead of dividing by zero', () => {
    expect(summarizeMemberFees([])).toEqual({
      totalMembers: 0,
      paidCount: 0,
      pendingCount: 0,
      paidPercentage: 0,
    })
  })
})

describe('paginateMemberFees', () => {
  const rows = Array.from({ length: 45 }, (_, index) => buildMember({ userId: `u${index}` }))

  it('defaults to the first 20 members', () => {
    const page = paginateMemberFees(rows)

    expect(page).toHaveLength(20)
    expect(page[0].userId).toBe('u0')
  })

  it('slices the requested page', () => {
    const page = paginateMemberFees(rows, 2, 20)

    expect(page[0].userId).toBe('u20')
    expect(page).toHaveLength(20)
  })

  it('returns a short final page rather than padding it', () => {
    expect(paginateMemberFees(rows, 3, 20)).toHaveLength(5)
  })

  it('returns nothing past the end instead of clamping to the last page', () => {
    expect(paginateMemberFees(rows, 99, 20)).toEqual([])
  })

  it('handles an empty list', () => {
    expect(paginateMemberFees([], 1, 20)).toEqual([])
  })
})
