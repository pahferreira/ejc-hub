import { api } from '../api'
import type { TeamOption } from './teams.types'

async function getTeamOptions() {
  const response = await api.get<{ teamOptions: TeamOption[] }>('/teams/options')
  return response.data.teamOptions
}

export const teamsApi = {
  getTeamOptions,
}
