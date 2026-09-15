import { describe, expect, it } from 'vitest'
import { mapTeamDetailToFeeRows } from './mapTeamDetailToFeeRows'
import type { TeamDetail, TeamRosterPerson } from '../../services/teams/teams.types'

function buildRosterPerson(overrides: Partial<TeamRosterPerson> = {}): TeamRosterPerson {
  return {
    userId: 'u-1',
    name: 'Maria Silva',
    nickname: 'Mari',
    phone: '(11) 91000-4000',
    pictureUrl: null,
    experienceType: 'experienced',
    circleKey: null,
    areas: ['Música'],
    preferences: ['Liturgia'],
    weekAvailability: ['monday'],
    eventFeeStatus: 'pending',
    ...overrides,
  }
}

function buildTeamDetail(overrides: Partial<TeamDetail> = {}): TeamDetail {
  return {
    id: 'team-1',
    templateKey: 'liturgia',
    name: 'Liturgia',
    description: null,
    memberCount: 0,
    maxCapacity: 10,
    freeSlots: 10,
    filledPercentage: 0,
    coordinatorSlots: 2,
    coordinators: [],
    members: [],
    ...overrides,
  }
}

describe('mapTeamDetailToFeeRows', () => {
  it('returns no rows for a team that has not loaded yet', () => {
    expect(mapTeamDetailToFeeRows(undefined)).toEqual([])
  })

  it('returns no rows for someone with no team in the event', () => {
    expect(mapTeamDetailToFeeRows(null)).toEqual([])
  })

  it('lists coordinators before members', () => {
    const team = buildTeamDetail({
      coordinators: [buildRosterPerson({ userId: 'coord-1', name: 'Ana Rosário' })],
      members: [buildRosterPerson({ userId: 'member-1', name: 'Bruno Reis' })],
    })

    expect(mapTeamDetailToFeeRows(team).map((row) => row.userId)).toEqual(['coord-1', 'member-1'])
  })

  it('derives the membership type from which roster the person sat in', () => {
    const team = buildTeamDetail({
      coordinators: [buildRosterPerson({ userId: 'coord-1' })],
      members: [buildRosterPerson({ userId: 'member-1' })],
    })

    expect(mapTeamDetailToFeeRows(team).map((row) => row.membershipType)).toEqual([
      'coordinator',
      'member',
    ])
  })

  it('carries the roster fee standing over as the row status', () => {
    const team = buildTeamDetail({
      members: [
        buildRosterPerson({ userId: 'member-1', eventFeeStatus: 'paid' }),
        buildRosterPerson({ userId: 'member-2', eventFeeStatus: 'pending' }),
      ],
    })

    expect(mapTeamDetailToFeeRows(team).map((row) => row.status)).toEqual(['paid', 'pending'])
  })

  it('keeps the identity fields the fee rows render', () => {
    const team = buildTeamDetail({
      members: [
        buildRosterPerson({
          userId: 'member-1',
          name: 'Júlia Barbosa',
          nickname: 'Ju',
          phone: '(31) 91942-5317',
          pictureUrl: 'https://example.test/ju.png',
          experienceType: 'newbie',
          circleKey: 'azul',
        }),
      ],
    })

    expect(mapTeamDetailToFeeRows(team)[0]).toEqual({
      userId: 'member-1',
      name: 'Júlia Barbosa',
      nickname: 'Ju',
      phone: '(31) 91942-5317',
      pictureUrl: 'https://example.test/ju.png',
      experienceType: 'newbie',
      circleKey: 'azul',
      membershipType: 'member',
      status: 'pending',
    })
  })
})
