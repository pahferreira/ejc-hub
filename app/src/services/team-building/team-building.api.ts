import { api } from '../api'
import type { AssignmentChange, TeamBoard } from './team-building.types'

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

export const teamBuildingApi = {
  getCurrentEventBoard,
  applyAssignments,
}
