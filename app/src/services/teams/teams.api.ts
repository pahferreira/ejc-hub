import { api } from '../api'
import type { TeamOption, TeamOverview, TeamsListFilters, TeamsOverviewStats } from './teams.types'

async function getTeamOptions() {
  const response = await api.get<{ teamOptions: TeamOption[] }>('/teams/options')
  return response.data.teamOptions
}

async function getCurrentEventTeams(filters: TeamsListFilters = {}) {
  const params = new URLSearchParams()

  if (filters.name) {
    params.set('name', filters.name)
  }

  if (filters.status) {
    params.set('status', filters.status)
  }

  const response = await api.get<{ teams: TeamOverview[] }>('/events/current/teams', { params })
  return response.data.teams
}

async function getCurrentEventTeamsOverview() {
  const response = await api.get<{ stats: TeamsOverviewStats }>('/events/current/teams/overview')
  return response.data.stats
}

export const teamsApi = {
  getTeamOptions,
  getCurrentEventTeams,
  getCurrentEventTeamsOverview,
}
