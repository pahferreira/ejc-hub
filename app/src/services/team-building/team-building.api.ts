import { api } from '../api'
import type { AssignmentChange, CandidateListResponse, TeamBoard } from './team-building.types'

async function getCurrentEventBoard() {
  const response = await api.get<{ board: TeamBoard }>('/team-building/board')
  return response.data.board
}

async function applyAssignments(assignments: AssignmentChange[]) {
  const response = await api.post<{ board: TeamBoard }>('/team-building/assignments', {
    assignments,
  })
  return response.data.board
}

async function getCandidates(teamInstanceId: string): Promise<CandidateListResponse> {
  const response = await api.get<CandidateListResponse>(
    `/team-building/teams/${teamInstanceId}/candidates`
  )
  return response.data
}

async function assignCoordinators(teamInstanceId: string, coordinatorIds: string[]): Promise<void> {
  await api.put(`/team-building/teams/${teamInstanceId}/coordinators`, { coordinatorIds })
}

export const teamBuildingApi = {
  getCurrentEventBoard,
  applyAssignments,
  getCandidates,
  assignCoordinators,
}
