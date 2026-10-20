import { describe, it, expect } from 'vitest'
import { countMyTeamStats, filterMyTeamRows } from './member-request-my-team.ts'
import type { MyTeamRequestRow } from '../domain/member-request.types.ts'

function buildRow(
  overrides: Partial<MyTeamRequestRow> & Pick<MyTeamRequestRow, 'id'>
): MyTeamRequestRow {
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
    requestedBy: { name: 'João Santos', nickname: 'João' },
    message: null,
    requestedAt: new Date('2026-01-01'),
    resolvedAt: null,
    resolutionReason: null,
    ...overrides,
  }
}

describe('countMyTeamStats', () => {
  it('counts each settable status separately', () => {
    const stats = countMyTeamStats([
      buildRow({ id: 'r1', status: 'pending' }),
      buildRow({ id: 'r2', status: 'pending' }),
      buildRow({ id: 'r3', status: 'approved' }),
      buildRow({ id: 'r4', status: 'denied' }),
    ])

    expect(stats).toEqual({ pending: 2, approved: 1, denied: 1 })
  })

  it('ignores cancelled and outdated rows — they have no card', () => {
    const stats = countMyTeamStats([
      buildRow({ id: 'r1', status: 'cancelled' }),
      buildRow({ id: 'r2', status: 'outdated' }),
      buildRow({ id: 'r3', status: 'approved' }),
    ])

    expect(stats).toEqual({ pending: 0, approved: 1, denied: 0 })
  })

  it('reports zeroes for a team with no requests', () => {
    expect(countMyTeamStats([])).toEqual({ pending: 0, approved: 0, denied: 0 })
  })
})

describe('filterMyTeamRows', () => {
  const rows = [
    buildRow({
      id: 'r1',
      status: 'pending',
      user: {
        userId: 'u1',
        name: 'Júlia Ramos',
        nickname: 'Ju',
        pictureUrl: null,
        experienceType: 'experienced',
        circleKey: null,
      },
      requestedBy: { name: 'Ana Souza', nickname: 'Ana' },
    }),
    buildRow({
      id: 'r2',
      status: 'approved',
      user: {
        userId: 'u2',
        name: 'Bruno Carvalho',
        nickname: 'Bru',
        pictureUrl: null,
        experienceType: 'experienced',
        circleKey: null,
      },
    }),
    buildRow({ id: 'r3', status: 'cancelled' }),
    buildRow({ id: 'r4', status: 'outdated' }),
  ]

  it('returns everything when nothing is filtered', () => {
    expect(filterMyTeamRows(rows, {})).toHaveLength(4)
  })

  it('narrows to one status, including one with no card', () => {
    expect(filterMyTeamRows(rows, { status: 'cancelled' }).map((row) => row.id)).toEqual(['r3'])
  })

  it("searches the requested member's name, accent-insensitively", () => {
    expect(filterMyTeamRows(rows, { name: 'julia' }).map((row) => row.id)).toEqual(['r1'])
  })

  it("never matches the filer's name", () => {
    // I.4: the filer is always a teammate on this page, so searching them would
    // surface nothing the coordinator doesn't already know.
    expect(filterMyTeamRows(rows, { name: 'Ana Souza' })).toEqual([])
  })

  it('composes name and status with AND', () => {
    expect(filterMyTeamRows(rows, { name: 'julia', status: 'approved' })).toEqual([])
  })
})
