import { describe, it, expect } from 'vitest'
import { countQueueStats, filterQueueRows, paginateQueueRows } from './member-request-queue.ts'
import type { MemberRequestQueueRow } from '../domain/member-request.types.ts'

const TEAM_A = 'team-a'
const TEAM_B = 'team-b'

const teamKeys = new Map([
  [TEAM_A, 'liturgia'],
  [TEAM_B, 'acolhida'],
])

function buildRow(
  overrides: Partial<MemberRequestQueueRow> & Pick<MemberRequestQueueRow, 'id'>
): MemberRequestQueueRow {
  return {
    status: 'pending',
    user: {
      userId: 'user-1',
      name: 'Maria Silva',
      nickname: 'Mari',
      pictureUrl: null,
      experienceType: 'experienced',
      circleKey: null,
    },
    team: { id: TEAM_A, name: 'Liturgia', freeSlots: 7 },
    requestedBy: { name: 'João Santos', nickname: 'João' },
    message: null,
    requestedAt: new Date('2026-01-01'),
    resolvedAt: null,
    resolvedBy: null,
    resolutionReason: null,
    otherPendingRequests: [],
    ...overrides,
  }
}

function sibling(id: string) {
  return {
    id,
    team: { id: TEAM_B, name: 'Acolhida' },
    requestedBy: { name: 'Ana Souza', nickname: 'Ana' },
  }
}

describe('countQueueStats', () => {
  it('counts each status separately over the whole event', () => {
    const stats = countQueueStats([
      buildRow({ id: 'r1', status: 'pending' }),
      buildRow({
        id: 'r2',
        status: 'pending',
        user: {
          userId: 'u2',
          name: 'B',
          nickname: 'B',
          pictureUrl: null,
          experienceType: 'experienced',
          circleKey: null,
        },
      }),
      buildRow({ id: 'r3', status: 'approved' }),
      buildRow({ id: 'r4', status: 'denied' }),
      buildRow({ id: 'r5', status: 'denied' }),
    ])

    expect(stats).toEqual({
      pending: 2,
      disputedMembers: 0,
      disputedRequests: 0,
      approved: 1,
      denied: 2,
    })
  })

  it('counts disputed members, not disputed requests', () => {
    // Two requests for one person is one disputed member. The card reads "2" and
    // the table under it reads "1 - 2 de 2"; the unit mismatch is the whole
    // reason card 2 carries a caption.
    const stats = countQueueStats([
      buildRow({ id: 'r1', otherPendingRequests: [sibling('r2')] }),
      buildRow({ id: 'r2', otherPendingRequests: [sibling('r1')] }),
    ])

    expect(stats.disputedMembers).toBe(1)
    // The caption's other half: one member, two requests.
    expect(stats.disputedRequests).toBe(2)
    expect(stats.pending).toBe(2)
  })

  it('counts members and their requests separately when the two differ', () => {
    // The case the caption exists for: two disputed members holding five
    // requests between them (three for one, two for the other). A card reading
    // "2" over a table of five rows is only honest because the caption says
    // "2 membros · 5 solicitações".
    const contested = (id: string, userId: string, siblingIds: string[]) =>
      buildRow({
        id,
        status: 'pending',
        user: {
          userId,
          name: userId,
          nickname: userId,
          pictureUrl: null,
          experienceType: 'experienced',
          circleKey: null,
        },
        otherPendingRequests: siblingIds.map(sibling),
      })

    const stats = countQueueStats([
      contested('r1', 'u1', ['r2', 'r3']),
      contested('r2', 'u1', ['r1', 'r3']),
      contested('r3', 'u1', ['r1', 'r2']),
      contested('r4', 'u2', ['r5']),
      contested('r5', 'u2', ['r4']),
    ])

    expect(stats.disputedMembers).toBe(2)
    expect(stats.disputedRequests).toBe(5)
  })

  it('never counts a superseded request as denied', () => {
    // `outdated` belongs to no card. Folding it into "Negadas" would move that
    // counter every time an *approval* happened.
    const stats = countQueueStats([
      buildRow({ id: 'r1', status: 'approved' }),
      buildRow({ id: 'r2', status: 'outdated' }),
      buildRow({ id: 'r3', status: 'cancelled' }),
    ])

    expect(stats).toEqual({
      pending: 0,
      disputedMembers: 0,
      disputedRequests: 0,
      approved: 1,
      denied: 0,
    })
  })

  it('reports zeroes for an event with no requests', () => {
    expect(countQueueStats([])).toEqual({
      pending: 0,
      disputedMembers: 0,
      disputedRequests: 0,
      approved: 0,
      denied: 0,
    })
  })
})

describe('filterQueueRows', () => {
  const rows = [
    buildRow({ id: 'r1', status: 'pending', otherPendingRequests: [sibling('r2')] }),
    buildRow({
      id: 'r2',
      status: 'pending',
      team: { id: TEAM_B, name: 'Acolhida', freeSlots: 3 },
      requestedBy: { name: 'Ana Souza', nickname: 'Ana' },
      otherPendingRequests: [sibling('r1')],
    }),
    buildRow({
      id: 'r3',
      status: 'approved',
      user: {
        userId: 'u3',
        name: 'Júlia Ramos',
        nickname: 'Ju',
        pictureUrl: null,
        experienceType: 'experienced',
        circleKey: null,
      },
    }),
  ]

  it('returns everything when nothing is filtered', () => {
    expect(filterQueueRows(rows, {}, teamKeys)).toHaveLength(3)
  })

  it('narrows to one status', () => {
    expect(filterQueueRows(rows, { status: 'approved' }, teamKeys).map((row) => row.id)).toEqual([
      'r3',
    ])
  })

  it('keeps only contended pending requests when disputed is set', () => {
    expect(filterQueueRows(rows, { disputed: true }, teamKeys).map((row) => row.id)).toEqual([
      'r1',
      'r2',
    ])
  })

  it('never treats an answered request as disputed', () => {
    // An approved request is no longer contended, whatever else exists for that
    // person.
    const answered = [
      buildRow({ id: 'r9', status: 'approved', otherPendingRequests: [sibling('r8')] }),
    ]

    expect(filterQueueRows(answered, { disputed: true }, teamKeys)).toEqual([])
  })

  it('narrows by the team key rather than the instance id', () => {
    expect(filterQueueRows(rows, { teamKey: 'acolhida' }, teamKeys).map((row) => row.id)).toEqual([
      'r2',
    ])
  })

  it("searches the requested member's name, accent-insensitively", () => {
    expect(filterQueueRows(rows, { name: 'julia' }, teamKeys).map((row) => row.id)).toEqual(['r3'])
  })

  it("searches the requesting coordinator's name too", () => {
    expect(filterQueueRows(rows, { name: 'Ana Souza' }, teamKeys).map((row) => row.id)).toEqual([
      'r2',
    ])
  })

  it('composes status and team with AND', () => {
    expect(filterQueueRows(rows, { status: 'approved', teamKey: 'acolhida' }, teamKeys)).toEqual([])
  })
})

describe('paginateQueueRows', () => {
  const rows = Array.from({ length: 16 }, (_, index) => buildRow({ id: `r${index}` }))

  it('returns 15 rows per page by default', () => {
    expect(paginateQueueRows(rows)).toHaveLength(15)
  })

  it('returns the remainder on the last page', () => {
    expect(paginateQueueRows(rows, 2).map((row) => row.id)).toEqual(['r15'])
  })

  it('returns nothing past the end rather than clamping', () => {
    expect(paginateQueueRows(rows, 5)).toEqual([])
  })
})
