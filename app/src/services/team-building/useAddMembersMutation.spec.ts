import { describe, it, expect } from 'vitest'
import { partialMatchKey } from '@tanstack/react-query'
import { addMembersStaleKeys } from './useAddMembersMutation'
import { teamsOverviewQueryKeys } from '../teams/teams.types'
import { teamBuildingQueryKeys } from './team-building.types'
import { attendanceQueryKeys } from '../attendance/attendance.types'

const invalidates = (key: readonly unknown[]) =>
  addMembersStaleKeys('team-1').some((staleKey) => partialMatchKey(key, staleKey))

describe('addMembersStaleKeys', () => {
  it('marks every team detail page stale, so the open one refetches after adding members', () => {
    expect(invalidates(teamsOverviewQueryKeys.detail('cozinha'))).toBe(true)
  })

  it("marks the teams overview and the team's candidates stale", () => {
    expect(invalidates(teamsOverviewQueryKeys.stats)).toBe(true)
    expect(invalidates(teamsOverviewQueryKeys.list({ name: 'coz' }))).toBe(true)
    expect(invalidates(teamBuildingQueryKeys.teamCandidates('team-1'))).toBe(true)
  })

  it("marks the team's attendance roster stale, so the Presença rate covers the new roster", () => {
    expect(invalidates(attendanceQueryKeys.team('team-1'))).toBe(true)
    expect(invalidates(attendanceQueryKeys.team('team-2'))).toBe(false)
  })

  it("leaves other teams' candidates and the viewer's own team alone", () => {
    expect(invalidates(teamBuildingQueryKeys.teamCandidates('team-2'))).toBe(false)
    expect(invalidates(teamsOverviewQueryKeys.myTeam)).toBe(false)
  })
})
