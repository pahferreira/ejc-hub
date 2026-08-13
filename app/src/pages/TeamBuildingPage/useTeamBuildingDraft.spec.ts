import { describe, expect, it } from 'vitest'
import { computeDraftColumns } from './useTeamBuildingDraft'
import type { TeamBoard, TeamBoardMember } from '../../services/team-building/team-building.types'

function buildMember(overrides: Partial<TeamBoardMember> & Pick<TeamBoardMember, 'userId'>) {
  return {
    subscriptionId: `sub-${overrides.userId}`,
    name: overrides.userId,
    nickname: overrides.userId,
    phone: null,
    pictureUrl: null,
    experienceType: 'newbie',
    circleKey: null,
    areas: [],
    details: '',
    preferences: [],
    weekAvailability: [],
    ...overrides,
  } as TeamBoardMember
}

describe('computeDraftColumns', () => {
  it('keeps coordinators pinned at the top of their column, even after a member is dragged in', () => {
    const board: TeamBoard = {
      columns: [
        {
          id: 'unassigned',
          kind: 'unassigned',
          title: 'Sem Equipe',
          count: 1,
          members: [buildMember({ userId: 'moved-in' })],
        },
        {
          id: 'team-a',
          kind: 'team',
          title: 'Liturgia',
          count: 2,
          members: [
            buildMember({ userId: 'coord-1', isCoordinator: true }),
            buildMember({ userId: 'existing-member' }),
          ],
        },
      ],
    }

    // Simulate a drag: 'moved-in' is dropped into team-a, most recently moved.
    const overrides = { 'moved-in': 'team-a' }
    const moveOrder = ['moved-in']

    const columns = computeDraftColumns(board, overrides, moveOrder)
    const teamA = columns.find((column) => column.id === 'team-a')

    expect(teamA?.members.map((member) => member.userId)).toEqual([
      'coord-1',
      'moved-in',
      'existing-member',
    ])
    expect(teamA?.count).toBe(3)
  })

  it('returns the board unchanged (aside from wrapping) when there are no overrides', () => {
    const board: TeamBoard = {
      columns: [
        {
          id: 'team-a',
          kind: 'team',
          title: 'Liturgia',
          count: 2,
          members: [
            buildMember({ userId: 'coord-1', isCoordinator: true }),
            buildMember({ userId: 'member-1' }),
          ],
        },
      ],
    }

    const columns = computeDraftColumns(board, {}, [])

    expect(columns.find((column) => column.id === 'team-a')?.members.map((m) => m.userId)).toEqual([
      'coord-1',
      'member-1',
    ])
  })

  it('returns an empty array when the board is undefined', () => {
    expect(computeDraftColumns(undefined, {}, [])).toEqual([])
  })
})
