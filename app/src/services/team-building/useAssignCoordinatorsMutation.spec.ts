import { describe, it, expect } from 'vitest'
import { partialMatchKey } from '@tanstack/react-query'
import { assignCoordinatorsStaleKeys } from './useAssignCoordinatorsMutation'
import { teamsOverviewQueryKeys } from '../teams/teams.types'
import { teamBuildingQueryKeys } from './team-building.types'

const invalidates = (key: readonly unknown[]) =>
  assignCoordinatorsStaleKeys('team-1').some((staleKey) => partialMatchKey(key, staleKey))

describe('assignCoordinatorsStaleKeys', () => {
  it('marks every team detail page stale, so the open one refetches after assigning coordinators', () => {
    expect(invalidates(teamsOverviewQueryKeys.detail('cozinha'))).toBe(true)
  })

  it("marks the teams overview and the team's candidates stale", () => {
    expect(invalidates(teamsOverviewQueryKeys.stats)).toBe(true)
    expect(invalidates(teamsOverviewQueryKeys.list({ name: 'coz' }))).toBe(true)
    expect(invalidates(teamBuildingQueryKeys.teamCandidates('team-1'))).toBe(true)
  })

  it("leaves other teams' candidates and the viewer's own team alone", () => {
    expect(invalidates(teamBuildingQueryKeys.teamCandidates('team-2'))).toBe(false)
    expect(invalidates(teamsOverviewQueryKeys.myTeam)).toBe(false)
  })
})
