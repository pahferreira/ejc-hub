import { describe, it, expect } from 'vitest'
import {
  filterRequestableCandidates,
  paginateRequestableCandidates,
  sortRequestableCandidates,
  toRequestableStats,
  toRowStatus,
} from './requestable-members.ts'
import type { RequestableCandidateRow } from '../domain/member-request.types.ts'

const TEAM_A = 'team-a'
const TEAM_B = 'team-b'

function buildRow(
  overrides: Partial<RequestableCandidateRow> & Pick<RequestableCandidateRow, 'userId'>
): RequestableCandidateRow {
  return {
    name: 'Maria Silva',
    nickname: 'Mari',
    pictureUrl: null,
    experienceType: 'newbie',
    circleKey: null,
    areas: [],
    preferences: [],
    rowStatus: 'requestable',
    ...overrides,
  }
}

describe('toRowStatus', () => {
  it('reads someone with no membership and no open request as requestable', () => {
    expect(toRowStatus({ hasMembership: false, hasOpenRequestFromTeam: false })).toBe('requestable')
  })

  it('reads someone this team already asked for as requested', () => {
    expect(toRowStatus({ hasMembership: false, hasOpenRequestFromTeam: true })).toBe('requested')
  })

  it('lets a membership win over an open request', () => {
    // Beyond asking for, whoever asked. Unreachable today (the eligible list
    // excludes placed people) and tested anyway, so flipping that rule later is
    // one method and no rethinking of this one.
    expect(toRowStatus({ hasMembership: true, hasOpenRequestFromTeam: true })).toBe('assigned')
  })
})

describe('filterRequestableCandidates', () => {
  const rows = [
    buildRow({ userId: 'u1', name: 'Júlia Ramos', nickname: 'Ju', areas: ['Canta'] }),
    buildRow({
      userId: 'u2',
      name: 'Bruno Carvalho',
      nickname: 'Bru',
      areas: ['Toca violão'],
      experienceType: 'experienced',
      preferences: [{ teamInstanceId: TEAM_A, name: 'Liturgia' }],
    }),
    buildRow({ userId: 'u3', name: 'Ana Souza', nickname: 'Aninha', areas: [] }),
  ]

  it('returns every row when no filter is given', () => {
    expect(filterRequestableCandidates(rows, {}, TEAM_A)).toHaveLength(3)
  })

  it('matches an accented name typed without accents', () => {
    const found = filterRequestableCandidates(rows, { name: 'julia' }, TEAM_A)

    expect(found.map((row) => row.userId)).toEqual(['u1'])
  })

  it('searches the nickname as well as the full name', () => {
    const found = filterRequestableCandidates(rows, { name: 'Aninha' }, TEAM_A)

    expect(found.map((row) => row.userId)).toEqual(['u3'])
  })

  it('keeps a row carrying any of the selected skills', () => {
    const found = filterRequestableCandidates(rows, { skills: ['Canta', 'Toca violão'] }, TEAM_A)

    expect(found.map((row) => row.userId)).toEqual(['u1', 'u2'])
  })

  it('narrows by experience', () => {
    const found = filterRequestableCandidates(rows, { experience: ['experienced'] }, TEAM_A)

    expect(found.map((row) => row.userId)).toEqual(['u2'])
  })

  it('keeps rows carrying any of the selected experience levels', () => {
    // The union of two disjoint sets: `newbie` alone is u1 and u3, `experienced`
    // alone is u2, and ticking both boxes must return all three rather than the
    // intersection a single-valued filter would have forced the UI to fake.
    const found = filterRequestableCandidates(
      rows,
      { experience: ['newbie', 'experienced'] },
      TEAM_A
    )

    expect(found.map((row) => row.userId)).toEqual(['u1', 'u2', 'u3'])
  })

  it('drops every row when the selected experience matches nobody', () => {
    expect(
      filterRequestableCandidates(rows, { experience: ['experienced_outsider'] }, TEAM_A)
    ).toEqual([])
  })

  it('keeps everyone when every experience box is cleared', () => {
    expect(filterRequestableCandidates(rows, { experience: [] }, TEAM_A)).toHaveLength(3)
  })

  it("keeps only people who chose the caller's team when preference is team", () => {
    const found = filterRequestableCandidates(rows, { preference: 'team' }, TEAM_A)

    expect(found.map((row) => row.userId)).toEqual(['u2'])
  })

  it('keeps everyone when preference is all', () => {
    expect(filterRequestableCandidates(rows, { preference: 'all' }, TEAM_A)).toHaveLength(3)
  })

  it('does not match a preference for a different team', () => {
    expect(filterRequestableCandidates(rows, { preference: 'team' }, TEAM_B)).toEqual([])
  })

  it('composes filters with AND', () => {
    const found = filterRequestableCandidates(rows, { name: 'bruno', skills: ['Canta'] }, TEAM_A)

    expect(found).toEqual([])
  })
})

describe('sortRequestableCandidates', () => {
  it("puts this team's own asks first, then requestable, then assigned", () => {
    const rows = [
      buildRow({ userId: 'u1', nickname: 'Zeca', rowStatus: 'assigned' }),
      buildRow({ userId: 'u2', nickname: 'Ana', rowStatus: 'requestable' }),
      buildRow({ userId: 'u3', nickname: 'Yuri', rowStatus: 'requested' }),
    ]

    expect(sortRequestableCandidates(rows).map((row) => row.userId)).toEqual(['u3', 'u2', 'u1'])
  })

  it('puts newbies first, then the experienced, then outsiders', () => {
    const rows = [
      buildRow({ userId: 'u1', experienceType: 'experienced_outsider' }),
      buildRow({ userId: 'u2', experienceType: 'newbie' }),
      buildRow({ userId: 'u3', experienceType: 'experienced' }),
    ]

    expect(sortRequestableCandidates(rows).map((row) => row.userId)).toEqual(['u2', 'u3', 'u1'])
  })

  it('orders experience by level and not alphabetically by its enum value', () => {
    // Alphabetically these read experienced < experienced_outsider < newbie,
    // which is the wrong order; this is the test that fails if the explicit
    // positions are ever dropped for a localeCompare on experienceType.
    const rows = [
      buildRow({ userId: 'u1', experienceType: 'experienced' }),
      buildRow({ userId: 'u2', experienceType: 'newbie' }),
    ]

    expect(sortRequestableCandidates(rows).map((row) => row.userId)).toEqual(['u2', 'u1'])
  })

  it('orders within an experience level by nickname, accent-insensitively', () => {
    const rows = [
      buildRow({ userId: 'u1', nickname: 'Bruno' }),
      buildRow({ userId: 'u2', nickname: 'Ágata' }),
      buildRow({ userId: 'u3', nickname: 'Ana' }),
    ]

    expect(sortRequestableCandidates(rows).map((row) => row.userId)).toEqual(['u2', 'u3', 'u1'])
  })

  it('breaks a shared nickname by the full name', () => {
    const rows = [
      buildRow({ userId: 'u1', nickname: 'Ju', name: 'Bruna Lima' }),
      buildRow({ userId: 'u2', nickname: 'Jú', name: 'Ana Costa' }),
    ]

    expect(sortRequestableCandidates(rows).map((row) => row.userId)).toEqual(['u2', 'u1'])
  })

  it('keeps experience above the nickname', () => {
    const rows = [
      buildRow({ userId: 'u1', nickname: 'Ana', experienceType: 'experienced' }),
      buildRow({ userId: 'u2', nickname: 'Zeca', experienceType: 'newbie' }),
    ]

    expect(sortRequestableCandidates(rows).map((row) => row.userId)).toEqual(['u2', 'u1'])
  })

  it('floats a requested row above a newbie, because the status outranks experience', () => {
    // The requested row carries the worst experience position and the later
    // nickname, so only the tier can put it first.
    const rows = [
      buildRow({ userId: 'u1', nickname: 'Ana', experienceType: 'newbie' }),
      buildRow({
        userId: 'u2',
        nickname: 'Zeca',
        experienceType: 'experienced_outsider',
        rowStatus: 'requested',
      }),
    ]

    expect(sortRequestableCandidates(rows).map((row) => row.userId)).toEqual(['u2', 'u1'])
  })

  it('orders by experience within a single status tier', () => {
    const rows = [
      buildRow({ userId: 'u1', experienceType: 'experienced', rowStatus: 'requested' }),
      buildRow({ userId: 'u2', experienceType: 'newbie', rowStatus: 'requested' }),
    ]

    expect(sortRequestableCandidates(rows).map((row) => row.userId)).toEqual(['u2', 'u1'])
  })

  it('does not mutate the array it was given', () => {
    const rows = [
      buildRow({ userId: 'u1', nickname: 'Zeca' }),
      buildRow({ userId: 'u2', nickname: 'Ana' }),
    ]

    sortRequestableCandidates(rows)

    expect(rows.map((row) => row.userId)).toEqual(['u1', 'u2'])
  })
})

describe('paginateRequestableCandidates', () => {
  const rows = Array.from({ length: 20 }, (_, index) => buildRow({ userId: `u${index}` }))

  it('returns 15 rows per page by default', () => {
    expect(paginateRequestableCandidates(rows)).toHaveLength(15)
  })

  it('returns the remainder on the last page', () => {
    expect(paginateRequestableCandidates(rows, 2).map((row) => row.userId)).toEqual([
      'u15',
      'u16',
      'u17',
      'u18',
      'u19',
    ])
  })

  it('returns nothing past the end rather than clamping to the last page', () => {
    expect(paginateRequestableCandidates(rows, 9)).toEqual([])
  })
})

describe('toRequestableStats', () => {
  it("derives free slots from the team's capacity and head count", () => {
    const stats = toRequestableStats({
      memberCount: 8,
      maxCapacity: 15,
      pendingRequests: 2,
      approvedRequests: 0,
    })

    expect(stats).toEqual({
      freeSlots: 7,
      memberCount: 8,
      maxCapacity: 15,
      pendingRequests: 2,
      approvedRequests: 0,
      freeSlotsIfAllApproved: 5,
    })
  })

  it('clamps free slots at zero for an over-capacity team', () => {
    // Capacity is never enforced, so a team legitimately holds more people than
    // its template allows. "-2 vagas" would be arithmetic leaking out as a claim.
    const stats = toRequestableStats({
      memberCount: 17,
      maxCapacity: 15,
      pendingRequests: 0,
      approvedRequests: 0,
    })

    expect(stats.freeSlots).toBe(0)
  })

  it('clamps freeSlotsIfAllApproved at zero when the asks outnumber the slots', () => {
    const stats = toRequestableStats({
      memberCount: 14,
      maxCapacity: 15,
      pendingRequests: 4,
      approvedRequests: 1,
    })

    expect(stats.freeSlots).toBe(1)
    expect(stats.freeSlotsIfAllApproved).toBe(0)
  })
})
